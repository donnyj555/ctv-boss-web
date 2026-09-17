/**
 * First-touch sign-up attribution capture for the CTV Homes marketing site.
 *
 * Ad clicks land here (ctvhomes.com/...) carrying utm_* and/or fbclid; the CTAs
 * then send the visitor to the app (realestate.ctvhomes.com) to sign up. We drop
 * a cookie scoped to `.ctvhomes.com` so the app can read where they came from at
 * account-creation time. First-touch: never overwrite, so the original ad source
 * gets the credit. Mirrors lib/attribution.ts in the app repo.
 */
(function () {
  try {
    var COOKIE = "ctv_attr";
    if (document.cookie.split("; ").some(function (c) { return c.indexOf(COOKIE + "=") === 0; })) return;

    var p = new URLSearchParams(window.location.search);
    var pick = function (k) { var v = p.get(k); return v ? v.slice(0, 200) : undefined; };
    var a = {
      source: pick("utm_source"),
      medium: pick("utm_medium"),
      campaign: pick("utm_campaign"),
      content: pick("utm_content"),
      term: pick("utm_term"),
    };

    if (!a.source && p.get("fbclid")) { a.source = "facebook"; a.medium = a.medium || "paid-social"; }
    else if (!a.source && p.get("gclid")) { a.source = "google"; a.medium = a.medium || "cpc"; }
    else if (!a.source && p.get("ttclid")) { a.source = "tiktok"; a.medium = a.medium || "paid-social"; }

    var refHost;
    try { refHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) { refHost = ""; }
    if (refHost && refHost.indexOf("ctvhomes.com") === -1) {
      a.referrer = refHost;
      if (!a.source) {
        if (/facebook|instagram|fb\.|l\.facebook/.test(refHost)) a.source = "facebook";
        else if (/google\./.test(refHost)) a.source = "google";
        else a.source = refHost;
      }
    }
    a.landing = (window.location.pathname + window.location.search).slice(0, 300);

    // Keep only truthy fields.
    var out = {};
    var has = false;
    Object.keys(a).forEach(function (k) { if (a[k]) { out[k] = a[k]; if (k !== "landing") has = true; } });
    if (!has) return; // direct / internal visit — nothing worth recording

    var host = window.location.hostname;
    var onCtv = host === "ctvhomes.com" || /\.ctvhomes\.com$/.test(host);
    var domain = onCtv ? "; domain=.ctvhomes.com" : "";
    var secure = window.location.protocol === "https:" ? "; Secure" : "";
    var maxAge = 90 * 24 * 60 * 60;
    document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(out)) +
      "; Max-Age=" + maxAge + "; Path=/" + domain + secure + "; SameSite=Lax";
  } catch (e) { /* best-effort */ }
})();
