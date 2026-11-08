/* ============ Horizon UPDATES — config ============ */
const REPO = "starling-client/starling";
// Paste a YouTube link (watch / youtu.be / shorts / embed) or a direct .mp4 URL:
const VIDEO_URL = "https://youtu.be/aTA11AwHW9M?si=yKgRa6JPwPISIIqx";
/* ================================================== */

(function () {
  "use strict";

  const API = "https://api.github.com/repos/" + REPO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ic = (n, c) => '<svg class="ic' + (c ? " " + c : "") + '"><use href="#i-' + n + '"/></svg>';
  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const fmtSize = (b) => (b / 1048576).toFixed(1) + " MB";

  /* ---------- static fallback data (used if the GitHub API is unreachable) ---------- */
  const ABIS = [
    { key: "arm64-v8a", note: "Most phones" },
    { key: "armeabi-v7a", note: "Older 32-bit phones" },
    { key: "x86_64", note: "Emulators & Chromebooks" },
    { key: "x86", note: "Emulators (32-bit)" }
  ];
  // sizes order: arm64-v8a, armeabi-v7a, x86, x86_64
  const FB_REL = [
    { tag: "v0.7.8", name: "Horizon Android 0.7.8", date: "2026-11-07T00:24:34Z", pre: false, ver: "0.7.8", s: [37484904, 32390190, 38224830, 40636249] },
    { tag: "v0.7.7", name: "Horizon Android 0.7.7", date: "2026-11-02T22:54:34Z", pre: false, ver: "0.7.7", s: [36557160, 31541806, 37168934, 39629805] },
    { tag: "v0.7.6", name: "Horizon Android 0.7.6", date: "2026-10-31T23:30:12Z", pre: false, ver: "0.7.6", s: [35233024, 30309690, 35645566, 38180413] },
    { tag: "v0.7.6-rc1", name: "Horizon Android 0.7.6 RC1", date: "2026-10-31T13:02:00Z", pre: true, ver: "0.7.6", s: [34672064, 0, 0, 0] },
    { tag: "v0.7.5", name: "Horizon Android 0.7.5", date: "2026-10-31T00:04:24Z", pre: false, ver: "0.7.5", s: [33439928, 28630910, 33593174, 36247025] }
  ];
  function fbRelease(f) {
    const base = "https://github.com/" + REPO + "/releases/download/" + f.tag + "/";
    const order = ["arm64-v8a", "armeabi-v7a", "x86", "x86_64"];
    const apks = {};
    order.forEach((k, i) => { if (f.s[i]) apks[k] = { url: base + "Horizon-Android-" + f.ver + "-" + k + ".apk", size: f.s[i] }; });
    return { tag: f.tag, name: f.name, date: f.date, pre: f.pre, url: "https://github.com/" + REPO + "/releases/tag/" + f.tag, apks: apks, sums: base + "SHA256SUMS.txt" };
  }

  const FB_CONTRIB_RAW = "ludovic111:7256,levzzz5154:1062,kacpherek:1054,rdbtCVS:778,Vasysik:205,xFedeT:139,d3grando:138,Online5277:123,martipops:80,Domanffe:78,DUzzL:75,GoyDevv:74,Teiwazik:72,Sylviromi:70,sirrayi:67,MSedgeMC:63,elythepreciouscat:62,PzmuV1517:59,arismoko:56,claude:55,senjinthedragon:54,ThatCakeIsAPie:53,socksprox:52,masa-masa-0314:48,GIGABAIT93:44,some-du6e:42,reservedbytes:41,codex:37,leifiyoo:37,iLostName:36,WooCaash:33,Qwerner88880:29,FusselTV:25,degepie:24,hectoreccles:21,Joansitoh:21,DenisHumen:20,stievenw:20,AurelienBelloir:19,ErikKalikas:19,spidercraft:18,LookImEcho-Rick:17,josegil1909:16,navinor:16,k3yh:15,vlesmentie:14,mariuslozo-boop:13,doodlyyousuf:13,Ashura006:11,TobiasLogic:11,UMCEKO:11,ludovicthenot:11,Vaspyyy:11,Xmilon:10,mulareal:10,v3nn7:10,ItsPotatoTime:9,Bloodulon:9,apeirs:9,deezhizyu:8,JulesB40:8,JustKarkat:8,Teiwazikk:8,feeldev12:8,kerimgrande:8,posok124521:8,RVZO6:7,damnurmum:7,Stink-O:7,Akirabane:7,carlosnunez09:7,Mik00000:7,kaito65452:6,TraiNguyenVan:6,repositorykreml1n:6,ult1mq:6,quintyo:6,oskal675-design:6,lazy-importer:6,Expected333:6,echo-ilovech3ss:6,NetuosoDEV:6,Detimes:6,CocofireHD:6,Aridj4861:6,Username59138:5";
  const FB_CONTRIB = FB_CONTRIB_RAW.split(",").map((x) => { const p = x.split(":"); return { login: p[0], c: +p[1] }; });

  /* ---------- tiny cached fetch ---------- */
  function getJSON(url, ttl) {
    const key = "hz:" + url;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) { const o = JSON.parse(raw); if (Date.now() - o.t < ttl) return Promise.resolve(o.d); }
    } catch (e) {}
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => { try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} return d; });
  }

  /* ---------- nav / reveal / misc ---------- */
  const nav = $("#nav"), links = $("#links"), burger = $("#burger");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    burger.innerHTML = ic(open ? "x" : "menu");
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.innerHTML = ic("menu"); }
  });
  $("#year").textContent = new Date().getFullYear();

  const rev = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add("in"));

  // avatar fallback
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t && t.tagName === "IMG" && t.dataset.av) { delete t.dataset.av; t.src = "logo.png"; }
  }, true);

  // interactive mockups
  $$("[data-tabs]").forEach((root) => {
    root.addEventListener("click", (e) => {
      const tog = e.target.closest(".tog");
      if (tog && root.contains(tog)) { tog.classList.toggle("on"); return; }
      const b = e.target.closest("[data-tab]");
      if (!b || !root.contains(b)) return;
      const id = b.getAttribute("data-tab");
      $$("[data-tab]", root).forEach((x) => x.classList.toggle("on", x === b));
      $$("[data-panel]", root).forEach((p) => p.classList.toggle("on", p.getAttribute("data-panel") === id));
    });
  });

  function countTo(el, to) {
    if (!el) return;
    const from = 0, dur = 900, t0 = performance.now();
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- releases ---------- */
  let RELS = FB_REL.map(fbRelease);
  let filter = "all";

  function abiBtn(r, a, withNote, rec) {
    const x = r.apks[a.key];
    if (!x) return "";
    return '<a class="abi-btn' + (rec ? " rec" : "") + '" href="' + esc(x.url) + '" target="_blank" rel="noopener" title="' + esc(a.note) + '">' +
      ic("download") + "<b>" + a.key + "</b>" +
      (withNote ? '<i class="abi-note">' + (rec ? "Recommended" : esc(a.note)) + "</i>" : "") +
      "<small>" + fmtSize(x.size) + "</small></a>";
  }

  function renderLatest() {
    const l = RELS.find((r) => !r.pre) || RELS[0];
    if (!l) return;
    const ver = l.tag.replace(/^v/, "");
    $("#heroVer").textContent = l.tag;
    $("#heroDate").textContent = "Published " + fmtDate(l.date);
    $("#heroAbis").innerHTML = ABIS.map((a, i) => abiBtn(l, a, false, i === 0)).join("");
    $("#stVer").textContent = ver;
    $("#dlVer").textContent = ver;
    $("#dlDate").textContent = fmtDate(l.date);
    $("#dlAbis").innerHTML = ABIS.map((a, i) => abiBtn(l, a, true, i === 0)).join("");
    $("#dlSums").href = l.sums || l.url;
  }

  function renderReleases() {
    const list = $("#relList");
    const latest = RELS.find((r) => !r.pre);
    const rows = RELS.filter((r) => filter === "all" || (filter === "pre" ? r.pre : !r.pre));
    if (!rows.length) { list.innerHTML = '<div class="empty">No releases in this filter.</div>'; return; }
    list.innerHTML = rows.map((r) => {
      const isLatest = latest && r.tag === latest.tag;
      const btns = ABIS.map((a, i) => abiBtn(r, a, true, i === 0)).join("");
      return '<article class="rel' + (isLatest ? " latest open" : "") + '">' +
        '<button class="rel-head" type="button" aria-expanded="' + (isLatest ? "true" : "false") + '">' +
        "<div><h3>" + esc(r.name) +
        (isLatest ? '<span class="tag tag-new">Latest</span>' : "") +
        (r.pre ? '<span class="tag tag-pre">Pre-release</span>' : '<span class="tag tag-live">Stable</span>') +
        "</h3><small>" + esc(r.tag) + " &middot; " + fmtDate(r.date) + "</small></div>" +
        ic("chevron", "chev") + "</button>" +
        '<div class="rel-body"><div class="abi-list">' + btns + "</div>" +
        '<div class="rel-foot"><a class="btn btn-ghost btn-sm" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + ic("book") + " Release notes</a>" +
        (r.sums ? '<a class="btn btn-ghost btn-sm" href="' + esc(r.sums) + '" target="_blank" rel="noopener">' + ic("hash") + " SHA256</a>" : "") +
        "</div></div></article>";
    }).join("");
  }

  $("#relList").addEventListener("click", (e) => {
    const h = e.target.closest(".rel-head");
    if (!h) return;
    const card = h.parentElement, open = card.classList.toggle("open");
    h.setAttribute("aria-expanded", open);
  });
  $("#relFilter").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    filter = b.getAttribute("data-f");
    $$(".chip", $("#relFilter")).forEach((c) => c.classList.toggle("on", c === b));
    renderReleases();
  });

  renderLatest();
  renderReleases();

  getJSON(API + "/releases?per_page=30", 600000).then((data) => {
    const out = data.filter((r) => !r.draft).map((r) => {
      const apks = {}; let sums = null;
      (r.assets || []).forEach((a) => {
        const m = a.name.match(/-(arm64-v8a|armeabi-v7a|x86_64|x86)\.apk$/i);
        if (m) apks[m[1].toLowerCase()] = { url: a.browser_download_url, size: a.size };
        else if (/sha256/i.test(a.name)) sums = a.browser_download_url;
      });
      return { tag: r.tag_name, name: r.name || r.tag_name, date: r.published_at, pre: !!r.prerelease, url: r.html_url, apks: apks, sums: sums };
    }).filter((r) => Object.keys(r.apks).length);
    if (out.length) { RELS = out; renderLatest(); renderReleases(); }
  }).catch(() => {});

  /* ---------- repo stats ---------- */
  getJSON(API, 600000).then((d) => {
    if (d && d.stargazers_count != null) { countTo($("#stStars"), d.stargazers_count); countTo($("#stForks"), d.forks_count); }
  }).catch(() => {});

  /* ---------- contributors ---------- */
  let CONTRIB = FB_CONTRIB.slice();
  let expanded = false, query = "";
  const TOP = 8, FIRST = 40;
  const av = (login, s) => "https://github.com/" + encodeURIComponent(login) + ".png?size=" + s;

  function renderContrib() {
    const max = CONTRIB[0] ? CONTRIB[0].c : 1;
    $("#topContrib").innerHTML = CONTRIB.slice(0, TOP).map((u, i) =>
      '<a class="tc" href="https://github.com/' + esc(u.login) + '" target="_blank" rel="noopener">' +
      '<span class="rank">#' + (i + 1) + "</span>" +
      '<img data-av="1" loading="lazy" decoding="async" width="76" height="76" alt="" src="' + av(u.login, 152) + '">' +
      "<b>" + esc(u.login) + "</b><small>" + u.c.toLocaleString() + " commits</small>" +
      '<span class="meter"><i style="width:' + Math.max(6, Math.sqrt(u.c / max) * 100).toFixed(0) + '%"></i></span></a>'
    ).join("");

    const q = query.trim().toLowerCase();
    let pool = q ? CONTRIB.filter((u) => u.login.toLowerCase().includes(q)) : CONTRIB.slice(TOP);
    const total = pool.length;
    if (!q && !expanded) pool = pool.slice(0, FIRST);
    $("#wall").innerHTML = pool.length ? pool.map((u) =>
      '<a class="cw" href="https://github.com/' + esc(u.login) + '" target="_blank" rel="noopener">' +
      '<img data-av="1" loading="lazy" decoding="async" width="36" height="36" alt="" src="' + av(u.login, 72) + '">' +
      "<span><b>" + esc(u.login) + "</b><small>" + u.c.toLocaleString() + "</small></span></a>"
    ).join("") : '<div class="empty" style="grid-column:1/-1">No contributor matches &ldquo;' + esc(query) + "&rdquo;.</div>";
    $("#cCount").textContent = q ? total + " match" + (total === 1 ? "" : "es") : "Showing " + pool.length + " of " + (CONTRIB.length - TOP) + " more";
    const more = $("#cMore");
    more.style.display = q || CONTRIB.length - TOP <= FIRST ? "none" : "";
    more.textContent = expanded ? "Show fewer" : "Show everyone";
    $("#contribTitle").textContent = CONTRIB.length + " people.";
    $("#stContrib").setAttribute("data-count", CONTRIB.length);
  }
  renderContrib();
  countTo($("#stContrib"), CONTRIB.length);

  $("#cSearch").addEventListener("input", (e) => { query = e.target.value; renderContrib(); });
  $("#cMore").addEventListener("click", () => { expanded = !expanded; renderContrib(); });

  getJSON(API + "/contributors?per_page=100", 600000).then((data) => {
    const out = data.filter((u) => u.login && !/^noreply$/i.test(u.login) && u.type !== "Bot")
      .map((u) => ({ login: u.login, c: u.contributions }));
    if (out.length > 10) { CONTRIB = out; renderContrib(); countTo($("#stContrib"), out.length); }
  }).catch(() => {});

  /* ---------- video ---------- */
  const frame = $("#videoFrame"), playBtn = $("#playBtn"), hint = $("#videoHint");
  function embedFor(url) {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return '<iframe src="https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Horizon video"></iframe>';
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return '<video src="' + esc(url) + '" controls autoplay playsinline></video>';
    return null;
  }
  if (!VIDEO_URL) hint.textContent = "Video coming soon";
  playBtn.addEventListener("click", () => {
    const html = VIDEO_URL && embedFor(VIDEO_URL);
    if (html) frame.innerHTML = html;
    else hint.textContent = "Video coming soon";
  });
})();
     
