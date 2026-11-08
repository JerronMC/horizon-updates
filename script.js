// ===== Horizon UPDATES config =====
const REPO = "starling-client/starling";
const RELEASES_PAGE = "https://github.com/" + REPO + "/releases";
// Paste a YouTube link (watch / youtu.be / embed) or a direct .mp4 URL here:
const VIDEO_URL = "";
// ==================================

(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  // year + mobile nav
  $("#year").textContent = new Date().getFullYear();
  const burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); });

  // reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    items.forEach((i) => io.observe(i));
  } else items.forEach((i) => i.classList.add("in"));

  // helpers
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const fmtSize = (b) => (b / 1048576).toFixed(1) + " MB";

  // releases
  const list = $("#releaseList");
  fetch("https://api.github.com/repos/" + REPO + "/releases?per_page=15", { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((rels) => {
      if (!rels.length) throw new Error("empty");
      const latest = rels.find((r) => !r.prerelease && !r.draft) || rels[0];

      $("#latestLine").textContent = "Latest: " + (latest.name || latest.tag_name) + " \u2022 " + fmtDate(latest.published_at);
      const apk = (latest.assets || []).find((a) => /\.apk$/i.test(a.name));
      const btn = $("#latestApk");
      btn.href = apk ? apk.browser_download_url : latest.html_url;
      btn.textContent = "Latest: " + latest.tag_name;

      list.innerHTML = rels.filter((r) => !r.draft).map((r) => {
        const isLatest = r.id === latest.id;
        const apks = (r.assets || []).filter((a) => /\.apk$/i.test(a.name));
        const dl = apks.length
          ? apks.map((a) => '<a class="mc-btn green" href="' + esc(a.browser_download_url) + '" target="_blank" rel="noopener">APK ' + fmtSize(a.size) + "</a>").join("")
          : "";
        return '<div class="rel' + (isLatest ? " latest" : "") + '">' +
          "<div><h3>" + esc(r.name || r.tag_name) +
          (isLatest ? '<span class="tag new">LATEST</span>' : "") +
          (r.prerelease ? '<span class="tag pre">PRE-RELEASE</span>' : "") +
          '</h3><div class="meta">' + esc(r.tag_name) + " \u2022 " + fmtDate(r.published_at) + "</div></div>" +
          '<div class="acts">' + dl + '<a class="mc-btn dark" href="' + esc(r.html_url) + '" target="_blank" rel="noopener">Notes</a></div></div>';
      }).join("");
    })
    .catch(() => {
      $("#latestLine").textContent = "See the newest version on GitHub Releases.";
      list.innerHTML = '<div class="err">Could not load releases right now.<br><a href="' + RELEASES_PAGE + '" target="_blank" rel="noopener">Open GitHub Releases</a></div>';
    });

  // video
  const frame = $("#videoFrame"), playBtn = $("#playBtn");
  function embedFor(url) {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return '<iframe src="https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Horizon video"></iframe>';
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return '<video src="' + esc(url) + '" controls autoplay playsinline></video>';
    return null;
  }
  playBtn.addEventListener("click", () => {
    const html = VIDEO_URL && embedFor(VIDEO_URL);
    if (html) frame.innerHTML = html;
    else {
      const p = frame.querySelector("p");
      p.textContent = "Video coming soon \u2014 add VIDEO_URL in script.js";
    }
  });
})();
