/* Connie — CTV Homes site chat widget. Self-contained; include with
   <script src="connie.js" defer></script>. Talks to /api/chat (proxied to the
   app by Netlify _redirects). No dependencies. */
(function () {
  "use strict";
  if (window.__connieLoaded) return;
  window.__connieLoaded = true;

  var ACCENT = "#ff3366";
  var API = "/api/chat";

  // Friendly female avatar (inline SVG, brand gradient).
  var AVATAR =
    '<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">' +
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#ff5c8a"/><stop offset="1" stop-color="#ff2e63"/></linearGradient></defs>' +
    '<circle cx="32" cy="32" r="32" fill="url(#cg)"/>' +
    '<path d="M15 30c0-11 8-18 17-18s17 7 17 18c0 2-.4 6-1 8l-3-3c1-3 1-6 1-8H18c0 2 0 5 1 8l-3 3c-.6-2-1-6-1-8z" fill="#3a2140"/>' + // hair top
    '<circle cx="32" cy="34" r="13" fill="#ffd9c2"/>' + // face
    '<path d="M18 30c-1 8 0 16 3 20-4-2-7-8-7-16 0-2 .3-3 1-4zM46 30c1 8 0 16-3 20 4-2 7-8 7-16 0-2-.3-3-1-4z" fill="#3a2140"/>' + // side hair
    '<circle cx="27" cy="34" r="1.7" fill="#3a2140"/><circle cx="37" cy="34" r="1.7" fill="#3a2140"/>' + // eyes
    '<path d="M28 39c2 2 6 2 8 0" fill="none" stroke="#c2607a" stroke-width="1.8" stroke-linecap="round"/>' + // smile
    "</svg>";

  var css =
    "#connie-btn{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28);z-index:2147483000;padding:6px;background:#fff;transition:transform .15s}" +
    "#connie-btn:hover{transform:scale(1.06)}" +
    "#connie-btn .dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid #fff}" +
    "#connie-panel{position:fixed;right:20px;bottom:92px;width:370px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.32);z-index:2147483000;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}" +
    "#connie-panel.open{display:flex}" +
    "#connie-head{background:" + ACCENT + ";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}" +
    "#connie-head .av{width:38px;height:38px;border-radius:50%;overflow:hidden;flex:0 0 auto;background:#fff}" +
    "#connie-head b{font-size:15px;display:block;line-height:1.2}" +
    "#connie-head span{font-size:12px;opacity:.9}" +
    "#connie-head .x{margin-left:auto;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;opacity:.9}" +
    "#connie-msgs{flex:1;overflow-y:auto;padding:16px;background:#f7f7f9;display:flex;flex-direction:column;gap:10px}" +
    ".cm{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}" +
    ".cm.bot{background:#fff;color:#18181b;border:1px solid #ececf0;align-self:flex-start;border-bottom-left-radius:4px}" +
    ".cm.me{background:" + ACCENT + ";color:#fff;align-self:flex-end;border-bottom-right-radius:4px}" +
    ".cm a{color:inherit;text-decoration:underline}" +
    ".cm.bot a{color:" + ACCENT + "}" +
    "#connie-typing{align-self:flex-start;color:#9a9aa5;font-size:13px;padding:2px 4px}" +
    "#connie-foot{border-top:1px solid #ececf0;padding:10px;display:flex;gap:8px;background:#fff}" +
    "#connie-in{flex:1;border:1px solid #dcdce3;border-radius:20px;padding:10px 14px;font-size:14px;outline:none;font-family:inherit}" +
    "#connie-in:focus{border-color:" + ACCENT + "}" +
    "#connie-send{background:" + ACCENT + ";color:#fff;border:none;border-radius:20px;padding:0 16px;font-weight:600;cursor:pointer;font-size:14px}" +
    "#connie-send:disabled{opacity:.5;cursor:default}" +
    "#connie-cred{font-size:10.5px;color:#b4b4bd;text-align:center;padding:0 0 8px;background:#fff}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.id = "connie-btn";
  btn.setAttribute("aria-label", "Chat with Connie");
  btn.innerHTML = AVATAR + '<span class="dot"></span>';
  document.body.appendChild(btn);

  var panel = document.createElement("div");
  panel.id = "connie-panel";
  panel.innerHTML =
    '<div id="connie-head"><div class="av">' + AVATAR + "</div>" +
    "<div><b>Connie</b><span>CTV Homes assistant</span></div>" +
    '<button class="x" aria-label="Close">&times;</button></div>' +
    '<div id="connie-msgs"></div>' +
    '<div id="connie-foot"><input id="connie-in" type="text" placeholder="Ask about CTV Homes…" autocomplete="off"/>' +
    '<button id="connie-send">Send</button></div>' +
    '<div id="connie-cred">AI assistant · answers may vary</div>';
  document.body.appendChild(panel);

  var msgsEl = panel.querySelector("#connie-msgs");
  var inEl = panel.querySelector("#connie-in");
  var sendEl = panel.querySelector("#connie-send");
  var history = []; // {role, content}
  var started = false;
  var busy = false;

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  // Minimal linkify + preserve line breaks (content is escaped first).
  function fmt(s) {
    return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
  function bubble(role, text) {
    var d = document.createElement("div");
    d.className = "cm " + (role === "user" ? "me" : "bot");
    d.innerHTML = role === "user" ? esc(text) : fmt(text);
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function typing(on) {
    var t = panel.querySelector("#connie-typing");
    if (on && !t) {
      t = document.createElement("div"); t.id = "connie-typing"; t.textContent = "Connie is typing…";
      msgsEl.appendChild(t); msgsEl.scrollTop = msgsEl.scrollHeight;
    } else if (!on && t) { t.remove(); }
  }

  function open() {
    panel.classList.add("open");
    if (!started) {
      started = true;
      bubble("assistant", "Hi, I'm Connie 👋 I can answer questions about putting your listings on TV, pricing, or owning your farm — or connect you with Don. What can I help with?");
    }
    setTimeout(function () { inEl.focus(); }, 50);
  }
  function close() { panel.classList.remove("open"); }

  async function send() {
    var text = inEl.value.trim();
    if (!text || busy) return;
    inEl.value = "";
    bubble("user", text);
    history.push({ role: "user", content: text });
    busy = true; sendEl.disabled = true; typing(true);
    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      var data = await res.json();
      typing(false);
      var reply = (data && data.reply) || "Sorry, something went wrong — you can email Don at donjordan@ctvhomes.com.";
      bubble("assistant", reply);
      history.push({ role: "assistant", content: reply });
    } catch (e) {
      typing(false);
      bubble("assistant", "I couldn't reach the server. Please try again, or email donjordan@ctvhomes.com.");
    } finally {
      busy = false; sendEl.disabled = false; inEl.focus();
    }
  }

  btn.addEventListener("click", function () { panel.classList.contains("open") ? close() : open(); });
  panel.querySelector(".x").addEventListener("click", close);
  sendEl.addEventListener("click", send);
  inEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
})();
