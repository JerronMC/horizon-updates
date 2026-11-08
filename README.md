# Horizon Updates — Community Fan Hub

A static, mobile-first community website tracking Horizon, Starling and the transition from the separate Horizon Android project.

## Included

- `index.html` — complete single-page site and accessible navigation
- `style.css` — responsive visual system, dark/light themes and reduced-motion support
- `script.js` — live GitHub release/contributor data with graceful fallback content
- `logo.png` — project logo asset supplied with the original site
- `manifest.webmanifest` and `sw.js` — installable-site metadata and a small offline shell cache

## Run locally

Open `index.html` in a browser. For service-worker/PWA behavior, serve the folder over HTTPS or a local development server, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Live data sources

- Current Starling Android releases: https://github.com/JuanLuci/starling/releases
- Horizon Android historical releases: https://github.com/starling-client/starling/releases
- Preserved Android contributor history: https://github.com/starling-client/starling/graphs/contributors
- Official desktop Horizon site and release feed: https://playhorizon.dev and https://playhorizon.dev/releases

The browser requests public GitHub API data at runtime. If GitHub rate-limits or the network is unavailable, the page displays embedded fallback links and data. Release pages remain the source of truth.

## Publishing to GitHub Pages

Upload the contents of this folder to the repository's Pages source (usually the root of the `main` branch or the configured `/docs` folder), then enable GitHub Pages in repository settings. Keep all five site files together.

## Important note

This is an independent fan/community resource. It is not the official Horizon or Starling website and is not affiliated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Studios. Users must own their own Minecraft: Java Edition access.
