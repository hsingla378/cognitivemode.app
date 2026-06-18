# Cognitive Mode

Rebuild your problem-solving instinct before you offload to an LLM.

> [!IMPORTANT]
> **Vibe Coding Transparency**  
> This entire project is built using AI Vibe Coding. The irony is intentional: we are leveraging AI to build a tool that saves us from losing our cognitive edge to AI.

## Introduction

`cognitivemode-app` is a local-first product designed to introduce intentional friction into AI-assisted workflows.  
Instead of instant prompting, users are encouraged to pause, articulate hypotheses, and think through attempts before asking AI for help.

This repository is a monorepo containing:
- a marketing + onboarding website
- a browser extension workspace that enforces cognitive guardrails directly on AI tools

## Core Features

- **Intentional speedbumps**: delay loops that break automatic copy-paste behavior
- **Hypothesis gate**: require users to define what they think and what they tried first
- **Local-first privacy**: no backend dependency required for core product behavior
- **Developer-native UX**: high-contrast, minimal interface optimized for focused technical workflows

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

## Roadmap

- **Phase 1–5 (Web Base)**: Ship landing page, core product narrative, interactive extension simulator UX, and performance polish.
- **Phase 6–12 (Extension Engine)**: Build the core browser extension wrapper (Manifest V3, DOM content scripts, friction layout injection, local storage state tracking).
- **Phase 13–15 (Launch Prep)**: Polish deep linking/onboarding between the web app and extension, finalize store graphic assets, and publish to community channels.
- **Post-Sprint Features**:
  - Publish extension package natively to the Chrome Web Store.
  - Engineer a client-side analytics dashboard utilizing IndexedDB for local cognitive logs.
  - Expand targeted selectors for additional AI engineering interfaces.
