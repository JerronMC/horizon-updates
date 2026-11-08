/* Horizon Updates — community fan hub
   Live data sources: Starling releases, archived Horizon Android releases and GitHub contributors.
   This site is independent and is not an official Horizon, Starling or Minecraft property.
*/
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const API = "https://api.github.com/repos/";
  const STARLING_REPO = "JuanLuci/starling";
  const LEGACY_REPO = "starling-client/starling";
  const CONTRIBUTORS_REPO = "starling-client/starling";
  const STARLING_RELEASES = "https://github.com/JuanLuci/starling/releases";
  const LEGACY_RELEASES = "https://github.com/starling-client/starling/releases";
  const DESKTOP_RELEASES = "https://playhorizon.dev/releases";
  const CACHE_TTL = 5 * 60 * 1000;

  const FALLBACK_STARLING = [{
    tag_name: "v0.2.3",
    name: "Starling v0.2.3",
    html_url: STARLING_RELEASES + "/tag/v0.2.3",
    published_at: "",
    prerelease: false,
    body: "Starling 0.2.3 brings your worlds and resource packs over from Horizon Android, improves import feedback and fixes first-start behavior.",
    assets: [{
      name: "starling-0.2.3-arm64-v8a.apk",
      browser_download_url: "https://github.com/JuanLuci/starling/releases/download/v0.2.3/starling-0.2.3-arm64-v8a.apk",
      size: 0
    }]
  }];
  const FALLBACK_LEGACY = [{
    tag_name: "v0.7.8",
    name: "Horizon Android 0.7.8",
    html_url: LEGACY_RELEASES + "/tag/v0.7.8",
    published_at: "2026-11-07T00:24:34Z",
    prerelease: false,
    body: "Final stable release of Horizon Android as a separate project. Android development is moving forward under the Starling name.",
    assets: [
      { name: "Horizon-Android-0.7.8-arm64-v8a.apk", browser_download_url: "https://github.com/starling-client/starling/releases/download/v0.7.8/Horizon-Android-0.7.8-arm64-v8a.apk", size: 37484904 },
      { name: "Horizon-Android-0.7.8-armeabi-v7a.apk", browser_download_url: "https://github.com/starling-client/starling/releases/download/v0.7.8/Horizon-Android-0.7.8-armeabi-v7a.apk", size: 32390190 },
      { name: "Horizon-Android-0.7.8-x86.apk", browser_download_url: "https://github.com/starling-client/starling/releases/download/v0.7.8/Horizon-Android-0.7.8-x86.apk", size: 38224830 },
      { name: "Horizon-Android-0.7.8-x86_64.apk", browser_download_url: "https://github.com/starling-client/starling/releases/download/v0.7.8/Horizon-Android-0.7.8-x86_64.apk", size: 40636249 }
    ]
  }];

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function formatDate(value) {
    if (!value) return "Date not provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date not provided";
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
  }

  function formatSize(bytes) {
    const number = Number(bytes);
    if (!number) return "APK";
    return `${(number / 1048576).toFixed(1)} MB`;
  }

  async function getJSON(url) {
    const key = `horizon-updates:${url}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const record = JSON.parse(cached);
        if (Date.now() - record.savedAt < CACHE_TTL) return record.data;
      }
    } catch (_) { /* session storage can be disabled */ }

    const controller = "AbortController" in window ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 9000) : null;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      const data = await response.json();
      try { sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data })); } catch (_) { /* ignore */ }
      return data;
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("horizon-updates-theme", theme); } catch (_) { /* ignore */ }
    const button = $("#themeToggle");
    if (button) {
      const next = theme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Switch to ${next} theme`);
      button.setAttribute("title", `Switch to ${next} theme`);
      button.innerHTML = theme === "dark" ? '<svg class="ic"><use href="#i-sun"/></svg>' : '<svg class="ic"><use href="#i-moon"/></svg>';
    }
  }

  // Theme preference. Dark is the designed default; user's choice is remembered locally.
  let preferredTheme = "dark";
  try {
    const savedTheme = localStorage.getItem("horizon-updates-theme");
    if (savedTheme === "dark" || savedTheme === "light") preferredTheme = savedTheme;
  } catch (_) { /* ignore */ }
  setTheme(preferredTheme);
  $("#themeToggle")?.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  // Navigation and scroll utilities.
  const header = $("#siteHeader");
  const navLinks = $("#navLinks");
  const menuToggle = $("#menuToggle");
  const backTop = $("#backTop");
  const progress = $("#scrollProgress");
  function updateScrollUI() {
    const y = window.scrollY || 0;
    header?.classList.toggle("scrolled", y > 8);
    backTop?.classList.toggle("visible", y > 650);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
  }
  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  menuToggle?.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuToggle.innerHTML = open ? '<svg class="ic"><use href="#i-x"/></svg>' : '<svg class="ic"><use href="#i-menu"/></svg>';
  });
  navLinks?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navLinks.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
      if (menuToggle) menuToggle.innerHTML = '<svg class="ic"><use href="#i-menu"/></svg>';
    }
  });
  backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  $("#year").textContent = new Date().getFullYear();

  // Mark the visible section in the desktop/mobile navigation.
  if ("IntersectionObserver" in window) {
    const observed = $$('main section[id]');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$(".nav-links a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-28% 0px -62% 0px" });
    observed.forEach((section) => sectionObserver.observe(section));
  }

  function apkAssets(release, legacy = false) {
    return (release?.assets || []).filter((asset) => /\.apk$/i.test(asset.name || "")).map((asset) => {
      const match = (asset.name || "").match(/(arm64-v8a|armeabi-v7a|x86_64|x86)/i);
      return { ...asset, abi: match ? match[1].toLowerCase() : "apk", legacy };
    });
  }

  function chooseCurrentApk(release) {
    const assets = apkAssets(release).sort((a, b) => {
      const order = ["arm64-v8a", "armeabi-v7a", "x86_64", "x86"];
      return order.indexOf(a.abi) - order.indexOf(b.abi);
    });
    return assets.find((asset) => asset.abi === "arm64-v8a") || assets[0] || null;
  }

  function renderCurrentDownload(release) {
    const version = release?.tag_name || "v0.2.3";
    const apk = chooseCurrentApk(release);
    const releaseURL = release?.html_url || STARLING_RELEASES;
    $("#heroStarlingVersion").textContent = `Starling ${version}`;
    $("#starlingTag").textContent = version;
    $("#statStarling").textContent = version.replace(/^v/, "");
    $("#downloadStarlingVersion").textContent = version;
    if (release?.published_at) $("#heroStarlingDate").textContent = `Published ${formatDate(release.published_at)}`;
    if (apk) {
      $("#currentApkName").textContent = apk.name;
      $("#currentApkMeta").textContent = `${apk.abi} · ${formatSize(apk.size)} · 64-bit Android build`;
      $("#currentApkButton").href = apk.browser_download_url;
      $("#currentApkButton").setAttribute("aria-label", `Download ${apk.name}`);
      $("#starlingMainDownload").href = apk.browser_download_url;
    } else {
      $("#currentApkName").textContent = "Open the current release assets";
      $("#currentApkMeta").textContent = "Select the APK listed by the project";
      $("#currentApkButton").href = releaseURL;
      $("#starlingMainDownload").href = releaseURL;
    }
  }

  function renderLegacyDownload(release) {
    const assets = apkAssets(release, true);
    const names = {
      "arm64-v8a": "ARM64 · most modern Android phones",
      "armeabi-v7a": "ARMv7 · 32-bit ARM devices",
      "x86_64": "x86_64 · 64-bit emulators",
      "x86": "x86 · 32-bit emulators"
    };
    const container = $("#legacyApks");
    if (!assets.length) {
      container.innerHTML = `<a class="abi-link" href="${escapeHTML(release?.html_url || LEGACY_RELEASES)}" target="_blank" rel="noopener"><span>Open v0.7.8 release assets</span><svg class="ic"><use href="#i-arrow-up-right"/></svg></a>`;
      return;
    }
    const sorted = assets.sort((a, b) => ["arm64-v8a", "armeabi-v7a", "x86_64", "x86"].indexOf(a.abi) - ["arm64-v8a", "armeabi-v7a", "x86_64", "x86"].indexOf(b.abi));
    container.innerHTML = sorted.map((asset) => `
      <a class="abi-link" href="${escapeHTML(asset.browser_download_url)}" target="_blank" rel="noopener" title="${escapeHTML(asset.name)}">
        <span><strong>${escapeHTML(asset.abi)}</strong> · ${escapeHTML(names[asset.abi] || "APK build")}</span>
        <small>${formatSize(asset.size)}</small>
      </a>`).join("");
  }

  function shortBody(body) {
    if (!body) return "Open the release page for its full changelog and installation details.";
    return String(body)
      .replace(/<[^>]*>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/^\s*[-*+]\s*/gm, "• ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join("\n")
      .slice(0, 520);
  }

  let activeReleaseTab = "starling";
  let releaseSearchText = "";
  let starlingReleases = FALLBACK_STARLING;
  let legacyReleases = FALLBACK_LEGACY;

  function getActiveReleases() {
    return activeReleaseTab === "starling" ? starlingReleases : legacyReleases;
  }

  function renderReleaseList() {
    const list = $("#releaseList");
    const all = getActiveReleases();
    const query = releaseSearchText.trim().toLowerCase();
    const releases = all.filter((release) => {
      const searchable = `${release.name || ""} ${release.tag_name || ""} ${release.body || ""}`.toLowerCase();
      return !query || searchable.includes(query);
    });
    if (!releases.length) {
      list.innerHTML = '<div class="empty-card">No releases match that search. Try a version number or a shorter keyword.</div>';
      return;
    }
    const latestTag = all[0]?.tag_name;
    list.innerHTML = releases.slice(0, 12).map((release) => {
      const latest = release.tag_name === latestTag;
      const pre = !!release.prerelease;
      const assets = (release.assets || []).filter((asset) => /\.apk$/i.test(asset.name || "")).slice(0, 6);
      const assetHTML = assets.length ? `<div class="asset-list">${assets.map((asset) => `<a class="asset-link" href="${escapeHTML(asset.browser_download_url)}" target="_blank" rel="noopener"><svg class="ic"><use href="#i-download"/></svg>${escapeHTML(asset.name)} · ${formatSize(asset.size)}</a>`).join("")}</div>` : "";
      const releaseURL = release.html_url || (activeReleaseTab === "starling" ? STARLING_RELEASES : LEGACY_RELEASES);
      const checksum = (release.assets || []).find((asset) => /sha256/i.test(asset.name || ""));
      return `<article class="release-item ${latest ? "latest open" : ""}">
        <button class="release-head" type="button" aria-expanded="${latest ? "true" : "false"}">
          <span class="release-mark"><svg class="ic"><use href="#i-tag"/></svg></span>
          <span class="release-title"><strong>${escapeHTML(release.name || release.tag_name || "Release")}</strong><small>${escapeHTML(release.tag_name || "")} · ${formatDate(release.published_at)}</small></span>
          <span class="release-badges">${latest ? '<i class="release-badge latest">LATEST</i>' : ""}${pre ? '<i class="release-badge pre">PRE-RELEASE</i>' : '<i class="release-badge">RELEASE</i>'}</span>
          <svg class="ic release-chevron"><use href="#i-chevron"/></svg>
        </button>
        <div class="release-body"><p>${escapeHTML(shortBody(release.body))}</p>${assetHTML}<div class="release-actions"><a href="${escapeHTML(releaseURL)}" target="_blank" rel="noopener">Full release notes <svg class="ic"><use href="#i-arrow-up-right"/></svg></a>${checksum ? `<a href="${escapeHTML(checksum.browser_download_url)}" target="_blank" rel="noopener">SHA-256 checksums <svg class="ic"><use href="#i-arrow-up-right"/></svg></a>` : ""}</div></div>
      </article>`;
    }).join("");
  }

  $("#releaseList").addEventListener("click", (event) => {
    const button = event.target.closest(".release-head");
    if (!button) return;
    const item = button.closest(".release-item");
    const open = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  });

  $$("[data-release-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeReleaseTab = button.dataset.releaseTab;
      $$("[data-release-tab]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      $("#releaseExternal").href = activeReleaseTab === "starling" ? STARLING_RELEASES : LEGACY_RELEASES;
      $("#releaseStatus").innerHTML = `<i class="status-dot ${activeReleaseTab === "starling" ? "green" : "amber"}"></i> ${activeReleaseTab === "starling" ? "Current Starling release history" : "Archived Horizon Android release history"}`;
      releaseSearchText = "";
      $("#releaseSearch").value = "";
      renderReleaseList();
    });
  });
  $("#releaseSearch").addEventListener("input", (event) => {
    releaseSearchText = event.target.value;
    renderReleaseList();
  });

  async function loadReleaseData() {
    // The page remains useful from verified fallback data if GitHub's API is rate-limited.
    renderCurrentDownload(FALLBACK_STARLING[0]);
    renderLegacyDownload(FALLBACK_LEGACY[0]);
    renderReleaseList();

    const results = await Promise.allSettled([
      getJSON(`${API}${STARLING_REPO}/releases?per_page=12`),
      getJSON(`${API}${LEGACY_REPO}/releases?per_page=12`)
    ]);
    if (results[0].status === "fulfilled" && Array.isArray(results[0].value)) {
      const current = results[0].value.filter((release) => !release.draft);
      if (current.length) {
        starlingReleases = current;
        renderCurrentDownload(current[0]);
      }
    }
    if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
      const archived = results[1].value.filter((release) => !release.draft);
      if (archived.length) {
        legacyReleases = archived;
        const stable = archived.find((release) => release.tag_name === "v0.7.8") || archived[0];
        renderLegacyDownload(stable);
      }
    }
    const isCurrentLive = results[0].status === "fulfilled";
    const isLegacyLive = results[1].status === "fulfilled";
    const status = $("#releaseStatus");
    status.innerHTML = `<i class="status-dot ${isCurrentLive || isLegacyLive ? "green" : "amber"}"></i> ${isCurrentLive && isLegacyLive ? "Live GitHub data · refreshed just now" : "Using saved fallback data · open GitHub to verify"}`;
    renderReleaseList();
  }

  async function loadContributors() {
    const container = $("#contributorsList");
    try {
      const contributors = await getJSON(`${API}${CONTRIBUTORS_REPO}/contributors?per_page=100`);
      if (!Array.isArray(contributors) || !contributors.length) throw new Error("No contributor data");
      const people = contributors.filter((person) => person.login && person.type !== "Bot").slice(0, 16);
      $("#statContributors").textContent = contributors.length >= 100 ? "100+" : String(contributors.length);
      container.innerHTML = people.map((person) => `
        <a class="contributor-chip" href="https://github.com/${encodeURIComponent(person.login)}" target="_blank" rel="noopener" title="${escapeHTML(person.contributions || 0)} contributions">
          <img src="https://github.com/${encodeURIComponent(person.login)}.png?size=54" alt="" loading="lazy" width="27" height="27">
          <span>${escapeHTML(person.login)}</span>
        </a>`).join("");
    } catch (_) {
      $("#statContributors").textContent = "Open";
      container.innerHTML = '<a class="text-link" href="https://github.com/starling-client/starling/graphs/contributors" target="_blank" rel="noopener">View the preserved GitHub contributor graph <svg class="ic"><use href="#i-arrow-up-right"/></svg></a>';
    }
  }

  // Load the project video only after the visitor requests it.
  $("#playVideo").addEventListener("click", () => {
    const frame = $("#videoFrame");
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/gWK01tGlyFI?autoplay=1&rel=0";
    iframe.title = "Starling Android gameplay showcase";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    frame.replaceChildren(iframe);
  });

  // Progressive enhancement: install a tiny offline cache for the static site shell.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}), { once: true });
  }

  loadReleaseData();
  loadContributors();
})();
