# Cognitive Mode Web

Landing page and interactive product demo for [cognitivemode.app](https://cognitivemode.app).

This app is intentionally static and local-first in its messaging: it explains the problem, lets visitors feel the Hypothesis Gate through a browser-window simulator, and points them to the unpacked Chrome extension flow until the extension is published.

> Built with AI-assisted vibe coding, with the source kept explicit so the process is honest and inspectable.

## What This App Includes

- A high-contrast hero for the Cognitive Mode product narrative.
- A reactive install CTA that changes when the extension injects its local presence meta tag.
- An interactive extension simulator that reproduces the pause, timer, and two-field hypothesis gate.
- Feature and privacy sections focused on the zero-backend extension architecture.
- App Router metadata for title, description, keywords, Open Graph, and Twitter previews.

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

When the unpacked extension is active on `cognitivemode.app` or `localhost:3000`, its content script injects:

```html
<meta name="cognitivemode-extension" content="installed" />
```

The landing page watches `document.head` and changes the primary CTA from `Add to Chrome` to `Extension Installed` when that tag appears.
