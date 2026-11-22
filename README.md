# Cognitive Mode

[![Available in the Chrome Web Store](https://raw.githubusercontent.com/GoogleChrome/webstore-docs/master/images/ChromeWebStore_BadgeWBorder_v2_206x58.png)](https://chromewebstore.google.com/detail/cognitive-mode/hlflicjdpooonfjaciliblnmhkdmakgh)

Practice DSA with AI, without cheating yourself.

<!--
> [!IMPORTANT]
> **Vibe Coding Transparency**
> This entire project is built using AI Vibe Coding. The irony is intentional: we are leveraging AI to build a tool that saves us from losing our cognitive edge to AI.
-->

## Introduction

Cognitive Mode is a free, local-first Chrome extension for coding-interview practice. While a problem is open on LeetCode, GeeksforGeeks or takeUforward, asking ChatGPT, Claude, Gemini, Perplexity or DeepSeek for help opens a hint ladder: a nudge, the approach, an outline, or the full solution. The chosen level is appended to the user's own prompt, so their AI gives exactly that much help, with no API key and no backend.

Each attempt ends as solved clean, solved with hints, needed the solution, or didn't solve. Problems that needed help come back after 3, 7 and 21 days for a clean re-solve.

This repository is a monorepo containing:
- a marketing + onboarding website
- the browser extension

## Core Features

- **Hint ladder**: pick how much help each AI answer gives, in the AI chat you already use
- **Practice tracking**: timer, hint levels used, and one-tap result logging on supported practice sites
- **Re-solve queue**: spaced re-solves (3/7/21 days) with a due-count badge
- **Readiness by topic**: clean-solve rate per topic, weekly stats, streak
- **Local-first privacy**: everything lives in `chrome.storage.local`; no servers, no accounts, no API keys
- **Everyday mode**: the original think-first gate for any AI prompt, now optional

## Monorepo Architecture

```text
cognitivemode-app/
├─ apps/
│  ├─ web/         # Next.js app (landing page + product narrative)
│  └─ extension/   # Manifest V3 browser extension
├─ package.json    # Root workspace config
└─ README.md
```

### Workspace Notes

- `apps/web` contains the landing page and interactive simulator (Next.js + Tailwind)
- `apps/extension` contains the Manifest V3 extension, content script, overlay, popup dashboard, and local storage logic
- Root-level npm workspaces are used for dependency and script orchestration

## Getting Started

### Prerequisites

- Node.js `20.x`
- npm `10+`

### Install Dependencies

From the repo root:

```bash
npm install
```

### Run the Web App

From the repo root:

```bash
npm run dev:web
```

This starts the Next.js site from `apps/web`.

### Build the Extension

From the repo root:

```bash
npm run build:ext
```

This creates the unpacked Chrome extension in `apps/extension/dist`.

For local browser installation, follow the Chrome unpacked extension flow in [`apps/extension/README.md`](apps/extension/README.md#local-chrome-install).

### Package the Extension

From the repo root:

```bash
npm run package:ext
```

This rebuilds `apps/extension/dist` and writes a fresh `apps/extension/cognitivemode-release.zip` for Chrome Web Store upload or sideloading.

## Roadmap

- **Shipped (0.3.0)**: practice mode on LeetCode, GeeksforGeeks and takeUforward; hint ladder in ChatGPT, Claude, Gemini, Perplexity and DeepSeek; re-solve queue, topic readiness, dashboard.
- **Next**: Codeforces and Code360 adapters, verdict detection after Submit, shareable weekly card.

Design and plan: [`docs/superpowers/specs/2026-11-22-practice-mode-design.md`](docs/superpowers/specs/2026-11-22-practice-mode-design.md) and [`docs/superpowers/plans/2026-11-22-practice-mode.md`](docs/superpowers/plans/2026-11-22-practice-mode.md). Store copy: [`docs/store-listing.md`](docs/store-listing.md).
