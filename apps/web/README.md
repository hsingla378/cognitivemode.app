# Cognitive Mode Web

Landing page and interactive product demo for [cognitivemode.app](https://cognitivemode.app).

This app is intentionally static and local-first in its messaging: it explains the practice problem, lets visitors try the hint ladder in an interactive demo, and points them to the published [Chrome Web Store listing](https://chromewebstore.google.com/detail/cognitive-mode/hlflicjdpooonfjaciliblnmhkdmakgh).

<!-- > Built with AI-assisted vibe coding, with the source kept explicit so the process is honest and inspectable. -->

## What This App Includes

- A hero for the practice promise, with a reactive install CTA that changes when the extension injects its presence meta tag.
- An interactive hint-ladder demo (3Sum in a mock ChatGPT frame).
- How-it-works, why-it-works, comparison, and FAQ sections. The FAQ also emits `FAQPage` JSON-LD for search and answer engines.
- A generated Open Graph image (`app/opengraph-image.tsx`) plus App Router metadata.
- Welcome, privacy, and uninstall-feedback pages.

## Local Development

From the repository root:

```bash
npm install
npm run dev:web
```

Then open [http://localhost:3000](http://localhost:3000).

## Production Build

From the repository root:

```bash
npm run build:web
```

The Vercel project should use `apps/web` as its root directory and deploy the static Next.js output for `cognitivemode.app`.

## Extension Handshake

When the Chrome Web Store extension, or a local development build, is active on `cognitivemode.app` or `localhost`, its content script injects:

```html
<meta name="cognitivemode-extension" content="installed" />
```

The landing page checks for that tag on mount and listens for the `cognitivemode:ready` window event, then changes the primary CTA from `Add to Chrome` to `Extension Installed` as soon as the extension is detected.
