#!/usr/bin/env node
//
// Turns the Madhive CSV exports into one performance report per agent.
//
//   node reporting/build-reports.js
//
// Reads every CSV in reporting/data/, matches campaigns to agents using
// campaign-map.json, and writes a standalone HTML file per agent into
// reporting/out/. Open one in a browser and Cmd-P to hand a client a PDF.
//
// Nothing here touches the live site. data/ and out/ are gitignored so client
// numbers never get committed - Netlify publishes the repo root, so anything
// committed here would be downloadable from realestate.ctvhomes.com.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'out');

// ---------------------------------------------------------------- csv parsing

// Madhive quotes any field holding a comma ("31,327", "KSAT-TV: San Antonio, TX"),
// so a plain split(',') corrupts those rows.
function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else quoted = false;
            } else field += c;
        } else if (c === '"') {
            quoted = true;
        } else if (c === ',') {
            row.push(field); field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some(v => v.trim() !== '')) rows.push(row);
            row = [];
        } else field += c;
    }
    row.push(field);
    if (row.some(v => v.trim() !== '')) rows.push(row);

    if (!rows.length) return [];
    const header = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => {
        const o = {};
        header.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
        return o;
    });
}

// "31,327" -> 31327, "98.68%" -> 98.68, "" -> 0
const num = v => {
    if (v === undefined || v === null) return 0;
    const n = parseFloat(String(v).replace(/[,%$\s]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

// --------------------------------------------------------------- file loading

// The exports carry generated filenames, so classify by header shape rather
// than by name - that way renaming a download can't silently drop a report.
function classify(rows, filename) {
    if (!rows.length) return null;
    const keys = Object.keys(rows[0]);
    const has = k => keys.some(x => x.toLowerCase() === k);

    if (has('pacing status')) return 'pacing';
    if (has('platform')) return 'topline';
    if (has('campaigns')) return 'campaign';
    if (has('publishers')) return 'publisher';
    console.warn(`  ! skipping ${filename} - unrecognised columns: ${keys.join(', ')}`);
    return null;
}

// Both the OTT and display exports use identical headers, so the only reliable
// signal for a campaign/publisher file is the "platform" value of the topline
// file downloaded alongside it. Fall back to VCR: display has no video.
function loadAll() {
    if (!fs.existsSync(DATA)) {
        console.error(`No data directory. Create ${DATA} and drop the Madhive CSVs in it.`);
        process.exit(1);
    }
    const files = fs.readdirSync(DATA).filter(f => f.toLowerCase().endsWith('.csv'));
    if (!files.length) {
        console.error(`No CSVs found in ${DATA}`);
        process.exit(1);
    }

    const out = { topline: [], campaign: [], publisher: [], pacing: [] };
    for (const f of files) {
        const rows = parseCsv(fs.readFileSync(path.join(DATA, f), 'utf8'));
        const kind = classify(rows, f);
        if (!kind) continue;
        const platform = guessPlatform(f, rows, kind);
        out[kind].push({ file: f, platform, rows });
        console.log(`  loaded ${f}  ->  ${kind} / ${platform} (${rows.length} rows)`);
    }
    return out;
}

function guessPlatform(filename, rows, kind) {
    if (kind === 'topline') {
        const p = (rows[0].Platform || rows[0].platform || '').toLowerCase();
        if (p) return p;
    }
    const f = filename.toLowerCase();
    if (f.includes('display')) return 'display';
    if (f.includes('ott') || f.includes('ctv')) return 'ott';
    return 'unknown';
}

// ------------------------------------------------------------------- mapping

function loadMap() {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'campaign-map.json'), 'utf8'));
    const byName = new Map();
    for (const c of m.campaigns) byName.set(c.name, c);
    return { agents: m.agents, byName, settings: m.settings || {} };
}

// Picks the networks to name in the lineup section. Ranking by impressions
// alone surfaces whichever inventory happened to be cheapest that month, so an
// optional `feature_networks` allowlist in campaign-map.json takes precedence
// and lets the operator decide which brands represent the product.
function buildLineup(publisherFiles, settings) {
    if (settings.show_network_lineup === false) return null;

    const ott = publisherFiles.filter(f => f.platform !== 'display');
    if (!ott.length) return null;

    const totals = new Map();
    for (const f of ott) {
        for (const row of f.rows) {
            const name = row.Publishers || row.publishers;
            if (!name) continue;
            totals.set(name, (totals.get(name) || 0) + num(row.Impressions));
        }
    }
    if (!totals.size) return null;

    const featured = settings.feature_networks;
    let names;
    if (Array.isArray(featured) && featured.length) {
        // Only name a network that actually appears in the export - never
        // advertise inventory the account did not run on.
        const missing = featured.filter(n => !totals.has(n));
        if (missing.length) console.warn(`  ! feature_networks not found in the publisher export, skipped: ${missing.join(', ')}`);
        names = featured.filter(n => totals.has(n));
    } else {
        names = [...totals.entries()].sort((a, b) => b[1] - a[1])
            .slice(0, settings.lineup_count || 15).map(e => e[0]);
    }

    return { names, totalNetworks: totals.size };
}

// ---------------------------------------------------------------- aggregation

// Frequency and rates are ratios - they cannot be summed across campaigns.
// Impressions and reach are summed, then frequency is recomputed from the
// totals. Reach summed across campaigns double-counts any household that saw
// two of an agent's listings, so it is an upper bound and labelled as such.
function blankTotals() {
    return { impressions: 0, reach: 0, conversions: 0, uniqueConversions: 0, campaigns: [] };
}

function addCampaign(t, name, listing, row) {
    const imps = num(row.Impressions);
    const reach = num(row.Reach ?? row['Unique Reach']);
    const conv = num(row['Total Conversions'] ?? row['Total Conversion']);
    const uconv = num(row['Unique Conversions']);
    t.impressions += imps;
    t.reach += reach;
    t.conversions += conv;
    t.uniqueConversions += uconv;
    t.campaigns.push({ name, listing, impressions: imps, reach, conversions: conv });
}

function build() {
    console.log('Loading CSVs...');
    const data = loadAll();
    const { agents, byName, settings } = loadMap();

    const perAgent = {};
    const unmapped = [];
    const excluded = [];

    for (const file of data.campaign) {
        for (const row of file.rows) {
            const name = row.Campaigns || row.campaigns;
            if (!name) continue;

            const entry = byName.get(name);
            if (!entry) {
                unmapped.push({ name, platform: file.platform, impressions: num(row.Impressions) });
                continue;
            }
            if (entry.exclude) {
                excluded.push({ name, platform: file.platform, impressions: num(row.Impressions) });
                continue;
            }
            if (!entry.agent || !agents[entry.agent]) {
                unmapped.push({ name, platform: file.platform, impressions: num(row.Impressions), reason: 'no agent assigned' });
                continue;
            }

            const key = entry.agent;
            perAgent[key] = perAgent[key] || {
                info: agents[key],
                ott: blankTotals(),
                display: blankTotals()
            };
            const bucket = file.platform === 'display' ? perAgent[key].display : perAgent[key].ott;
            addCampaign(bucket, name, entry.listing || name, row);
        }
    }

    // Account-wide VCR from the topline file. It is not campaign-level, so it is
    // only shown as a network-quality footnote, never as the agent's own number.
    let accountVcr = null;
    const ottTop = data.topline.find(t => t.platform === 'ott');
    if (ottTop && ottTop.rows.length) accountVcr = num(ottTop.rows[0].VCR);

    // Madhive's publisher export carries no campaign dimension, so these are
    // account-wide totals with the internal recruiting campaign mixed in. A
    // publisher's impressions cannot be split between agents, so this is
    // rendered as the network lineup CTV Homes buys across - never as a claim
    // about where one agent's ad personally ran. Display publishers are
    // deliberately excluded: a third of that inventory is mobile puzzle games,
    // which undercuts the premium story rather than supporting it.
    const networkLineup = buildLineup(data.publisher, settings);

    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

    console.log('\nWriting reports...');
    const written = [];
    for (const [key, agent] of Object.entries(perAgent)) {
        const file = path.join(OUT, `${key}.html`);
        fs.writeFileSync(file, renderAgent(agent, accountVcr, networkLineup));
        const total = agent.ott.impressions + agent.display.impressions;
        console.log(`  ${file}  (${total.toLocaleString()} impressions)`);
        written.push({ key, agent, total });
    }

    // ---- operator summary: what got shown, what silently did not
    console.log('\n--------------------------------------------------');
    console.log('EXCLUDED (internal, correctly kept out of reports):');
    if (!excluded.length) console.log('  none');
    excluded.forEach(e => console.log(`  ${String(e.impressions).padStart(7)}  ${e.name}  [${e.platform}]`));

    console.log('\nUNMAPPED (nobody sees these - fix campaign-map.json):');
    if (!unmapped.length) console.log('  none');
    unmapped.forEach(e => console.log(`  ${String(e.impressions).padStart(7)}  ${e.name}  [${e.platform}]${e.reason ? '  <- ' + e.reason : ''}`));

    const reported = written.reduce((a, w) => a + w.total, 0);
    const exc = excluded.reduce((a, e) => a + e.impressions, 0);
    const unm = unmapped.reduce((a, e) => a + e.impressions, 0);
    console.log('\nImpression reconciliation:');
    console.log(`  reported to agents : ${reported.toLocaleString()}`);
    console.log(`  excluded internal  : ${exc.toLocaleString()}`);
    console.log(`  unmapped (dropped) : ${unm.toLocaleString()}`);
    console.log(`  total in CSVs      : ${(reported + exc + unm).toLocaleString()}`);
    console.log('--------------------------------------------------');

    reportPacing(data.pacing, byName);
}

// Delivery pacing is an internal alert, never part of a client report - telling
// an agent their campaign is at 10% of goal invites a refund conversation
// before the campaign has had a chance to recover. Projection is a simple
// linear run-rate: whatever the campaign has averaged per day so far, carried
// forward to the end date. Madhive's own "Pace" column compares delivery to
// where it should be *today*; this instead answers "will it finish".
function reportPacing(pacingFiles, byName) {
    if (!pacingFiles.length) return;
    const rows = pacingFiles.flatMap(f => f.rows).filter(r => r.Name);
    if (!rows.length) return;

    // "9d 8h  ago" -> 9.33 ; "Completed" -> null
    const elapsedDays = s => {
        if (!s || /completed/i.test(s)) return null;
        const d = (s.match(/(\d+)\s*d/) || [])[1];
        const h = (s.match(/(\d+)\s*h/) || [])[1];
        if (d === undefined && h === undefined) return null;
        return (parseInt(d || 0, 10)) + (parseInt(h || 0, 10)) / 24;
    };
    const lengthDays = s => {
        const d = (s.match(/(\d+)\s*d/) || [])[1];
        return d === undefined ? null : parseInt(d, 10);
    };

    const alerts = [];
    for (const r of rows) {
        const entry = byName.get(r.Name);
        const internal = entry && entry.exclude;
        const goal = num(r.Goal);
        const delivered = num(r['Delivered Impressions']);
        const el = elapsedDays(r.Starting);
        const len = lengthDays(r.Length || '');
        const projected = (el && el > 0 && len) ? Math.round(delivered / el * len) : null;
        const pctOfGoal = goal ? delivered / goal : null;
        const projPct = (projected !== null && goal) ? projected / goal : null;
        alerts.push({ r, internal, goal, delivered, projected, pctOfGoal, projPct, budgetPaced: /budget/i.test(r['Pacing Type'] || '') });
    }

    console.log('\n=== DELIVERY PACING (internal - never shown to agents) ===');
    console.log('campaign                                   goal  delivered  projected  finish   status');
    let goalSum = 0, projSum = 0;
    for (const a of alerts.sort((x, y) => (x.projPct ?? 9) - (y.projPct ?? 9))) {
        if (a.budgetPaced) {
            const spend = num(a.r['Delivered Spend ($)']);
            const cpm = a.delivered ? spend / a.delivered * 1000 : 0;
            console.log(`  ${a.r.Name.slice(0, 40).padEnd(40)} ${a.r.Goal.padStart(8)} ${fmt(a.delivered).padStart(10)}  budget-paced, $${cpm.toFixed(2)} CPM`);
            continue;
        }
        if (!a.internal) { goalSum += a.goal; projSum += a.projected ?? a.delivered; }
        const flag = a.projPct === null ? '' :
            a.projPct < 0.05 ? '  <<< NOT DELIVERING' :
            a.projPct < 0.7 ? '  <<< WILL MISS GOAL' : '';
        console.log(`  ${a.r.Name.slice(0, 40).padEnd(40)} ${fmt(a.goal).padStart(8)} ${fmt(a.delivered).padStart(10)} ${(a.projected === null ? '—' : fmt(a.projected)).padStart(10)}  ${(a.projPct === null ? '—' : Math.round(a.projPct * 100) + '%').padStart(6)}${flag}`);
    }
    if (goalSum) {
        console.log(`\n  Client campaigns on current run-rate: ${fmt(projSum)} of ${fmt(goalSum)} contracted impressions (${Math.round(projSum / goalSum * 100)}%)`);
        console.log(`  Shortfall: ${fmt(goalSum - projSum)} impressions`);
    }
    console.log('==========================================================');
}

// ------------------------------------------------------------------ rendering

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.round(n).toLocaleString();

function statCard(label, value, sub, accent) {
    return `<div class="stat">
      <span class="stat-label">${esc(label)}</span>
      <span class="stat-value"${accent ? ` style="color:${accent}"` : ''}>${esc(value)}</span>
      <span class="stat-sub">${esc(sub)}</span>
    </div>`;
}

function renderAgent(agent, accountVcr, lineup) {
    const { ott, display, info } = agent;
    const totalImps = ott.impressions + display.impressions;
    const freq = ott.reach ? ott.impressions / ott.reach : 0;
    const conv = ott.conversions + display.conversions;

    // Several Madhive campaigns can share one listing label - the account has
    // four separate campaigns all named "Smart Way America Realty". Left alone
    // they render as identical duplicate rows, which reads as a bug to a client.
    const merge = (list, platform) => {
        const by = new Map();
        for (const c of list) {
            const k = c.listing;
            const prev = by.get(k) || { listing: k, platform, impressions: 0, reach: 0, conversions: 0 };
            prev.impressions += c.impressions;
            prev.reach += c.reach;
            prev.conversions += c.conversions;
            by.set(k, prev);
        }
        return [...by.values()];
    };

    const rows = [...merge(ott.campaigns, 'Streaming TV'),
                  ...merge(display.campaigns, 'Display')]
        .sort((a, b) => b.impressions - a.impressions)
        .map(c => `<tr>
            <td>${esc(c.listing)}</td>
            <td><span class="pill ${c.platform === 'Display' ? 'pill-d' : 'pill-t'}">${esc(c.platform)}</span></td>
            <td class="n">${fmt(c.impressions)}</td>
            <td class="n">${fmt(c.reach)}</td>
            <td class="n">${c.conversions ? c.conversions.toFixed(1) : '—'}</td>
          </tr>`).join('\n');

    return `<title>${esc(info.business_name)} — Campaign Report</title>
<style>
  :root{--bg:#0a0a0f;--card:#13131c;--line:rgba(255,255,255,.08);--red:#ff3366;--green:#4ade80;--main:#fff;--muted:#a0a0ab}
  *{box-sizing:border-box}
  body{margin:0;padding:2.5rem 1.5rem;background:var(--bg);color:var(--main);
       font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5}
  .wrap{max-width:920px;margin:0 auto}
  .brand{color:var(--red);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:.72rem}
  h1{font-family:Outfit,Inter,sans-serif;font-size:2rem;margin:.4rem 0 .2rem;font-weight:700}
  .sub{color:var(--muted);font-size:.95rem;margin-bottom:2rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem;margin-bottom:1rem}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:.3rem}
  .stat-label{color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;font-weight:600}
  .stat-value{font-family:Outfit,Inter,sans-serif;font-size:2rem;font-weight:700;line-height:1.1}
  .stat-sub{color:var(--muted);font-size:.78rem}
  h2{font-family:Outfit,Inter,sans-serif;font-size:1.15rem;margin:2.25rem 0 .85rem;font-weight:600}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-size:.9rem;min-width:520px}
  th{text-align:left;padding:.7rem .9rem;color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid var(--line);font-weight:600}
  td{padding:.75rem .9rem;border-bottom:1px solid rgba(255,255,255,.04)}
  tr:last-child td{border-bottom:none}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  .pill{font-size:.68rem;padding:.2rem .55rem;border-radius:99px;white-space:nowrap}
  .pill-t{background:rgba(255,51,102,.15);color:#ff7a9c}
  .pill-d{background:rgba(160,160,171,.15);color:var(--muted)}
  .nets{display:flex;flex-wrap:wrap;gap:.5rem}
  .net{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:.45rem .8rem;font-size:.85rem;white-space:nowrap}
  .netnote{color:var(--muted);font-size:.8rem;margin:.9rem 0 0}
  .note{color:var(--muted);font-size:.8rem;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--line)}
  @media print{body{background:#fff;color:#000;padding:1rem}.stat,table{background:#fff;border-color:#ddd}
    .stat-label,.stat-sub,.note,th{color:#555}}
</style>
<div class="wrap">
  <div class="brand">CTV Homes</div>
  <h1>${esc(info.business_name)}</h1>
  <div class="sub">Streaming TV &amp; display campaign performance</div>

  <div class="grid">
    ${statCard('Ad Views', fmt(totalImps), 'Times your ads played')}
    ${statCard('Households Reached', fmt(ott.reach), 'Unique streaming devices', '#4ade80')}
    ${statCard('Avg. Frequency', freq ? freq.toFixed(1) + '×' : '—', 'Views per household')}
    ${statCard('Site Visits', conv ? conv.toFixed(0) : '0', 'Drove viewers to your listing', '#ff3366')}
  </div>

  <h2>Campaign breakdown</h2>
  <div class="scroll">
  <table>
    <thead><tr><th>Listing</th><th>Channel</th><th class="n">Ad Views</th><th class="n">Reached</th><th class="n">Visits</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </div>

  ${lineup ? `<h2>Where CTV Homes places listing ads</h2>
  <div class="nets">${lineup.names.map(n => `<span class="net">${esc(n)}</span>`).join('')}</div>
  <p class="netnote">${lineup.totalNetworks} streaming networks carried CTV Homes listing ads this period.
  The specific mix for any one listing depends on its targeting and budget.</p>` : ''}

  <div class="note">
    <strong>Ad Views</strong> is the number of times your commercial played on a
    streaming TV or appeared as a display ad.
    <strong>Households Reached</strong> counts unique devices; a household that
    saw two of your listings is counted once per listing, so this is an upper bound.
    ${accountVcr ? `Across the CTV Homes network, <strong>${accountVcr.toFixed(1)}%</strong> of streaming ads played all the way through &mdash; viewers cannot skip them.` : ''}
  </div>
</div>`;
}

build();
