# Cognitive Mode Extension

Manifest V3 Chrome extension for the Cognitive Mode friction loop.

It intercepts prompt submissions on supported AI tools, asks the user to write a short hypothesis and what they already tried, waits for the configured delay, and stores the resulting cognitive log locally with `chrome.storage.local`.

## Supported Surfaces

- ChatGPT: `chatgpt.com`
- Claude: `claude.ai`
- Gemini: `gemini.google.com`
- Bolt: `bolt.new`
- v0: `v0.app` and `v0.dev`
- Cognitive Mode web app: injects `<meta name="cognitivemode-extension" content="installed" />` for the landing page handshake

## Architecture

```text
apps/extension/
|- manifest.json              # MV3 permissions, popup, content script, icons
|- popup.html                 # Extension popup entry
|- src/App.tsx                # Popup dashboard and settings
|- src/content/index.tsx      # Content-script entry and host routing
|- src/content/interceptor.ts # Platform DOM submit interception
|- src/content/Overlay.tsx    # Hypothesis Gate UI
|- src/content/storage.ts     # Local logs, stats, and settings
`- vite.config.ts             # Stable extension build outputs
```

## Local Chrome Install

From the repository root:

```bash
npm install
npm run build:ext
```

Then:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `apps/extension/dist`.
5. Refresh any open ChatGPT, Claude, v0, or local Cognitive Mode tabs.

## Development Notes

- Logs and settings stay local to the browser. There is no backend, telemetry, or external network dependency for the core extension behavior.
- The popup slider stores a custom friction delay from 5 to 60 seconds.
- Build output uses stable filenames because MV3 manifests cannot point at hashed content-script names.
- The extension is not published to the Chrome Web Store yet; the local unpacked flow above is the current install path.
