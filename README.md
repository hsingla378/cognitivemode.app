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
- an upcoming browser extension that enforces cognitive guardrails directly on AI tools

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
│  └─ extension/   # Browser extension (planned)
├─ package.json    # Root workspace config
└─ README.md
```

### Workspace Notes

- `apps/web` is the active app today (Next.js + Tailwind)
- `apps/extension` is reserved for the upcoming browser plugin implementation
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

