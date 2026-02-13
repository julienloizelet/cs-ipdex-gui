# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GUI application for CrowdSec CTI IP lookup. Queries the CTI API directly from Node.js (no external binary). Built with React + Vite frontend and Express + Socket.IO backend.

## Commands

```bash
npm run dev          # Start dev servers (client :5173, server :3000)
npm run build        # Build for production
npm start            # Run production server
npm run lint         # Run ESLint
npx playwright test  # Run e2e tests
```

## Testing

All new features must include related e2e tests. Tests use Playwright and are organized by purpose in the `e2e/` directory. Shared helpers are in `e2e/helpers.ts` and mock CTI responses in `e2e/fixtures/`.

**Important:** Before running e2e tests, check if the dev server (`npm run dev`) is already running. If it is, warn the user and ask them to stop it first. Tests may fail or use stale code if an existing server is running. You can check with `lsof -i:5173` or `lsof -i:3000`.

## Architecture

> **Note:** Keep this tree updated when adding, removing, or renaming files.

```
src/
├── client/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main wizard orchestrator (api-key → ip-input → executing → results)
│   ├── types.ts             # Client-side type definitions
│   ├── hooks/
│   │   ├── useSocket.ts     # Socket.IO connection and state management
│   │   └── useTheme.ts      # Dark/light theme toggle
│   └── components/
│       ├── Header.tsx       # App header with theme toggle
│       ├── ApiKeyForm.tsx   # API key input step
│       ├── IpInputForm.tsx  # IP address input step
│       ├── ConfirmDialog.tsx # Query confirmation modal
│       ├── CommandOutput.tsx # Real-time query progress display
│       └── ReportView.tsx   # Results display with stat cards
└── server/
    ├── index.ts             # Express + Socket.IO setup + per-socket session state
    └── services/cti/
        ├── index.ts         # Service exports
        ├── client.ts        # HTTP client (fetch with retry/backoff)
        ├── report.ts        # Report generation + stats aggregation
        ├── csv.ts           # CSV export functionality
        └── types.ts         # CTI API response types
```

**Wizard Flow**: API key setup → IP input → Query execution → Results display

**Real-time Communication**: Socket.IO streams progress from server to client. Client emits `init` (API key) or `createReport` (IPs array), server responds with `output` events.

**CTI Integration**: Server queries CrowdSec CTI API (`https://cti.api.crowdsec.net/v2`) directly via fetch. PoV keys use batch endpoint, community keys use single-IP endpoint with rate limiting. Results are aggregated into stats and sent via JSON markers in output.

## Documentation

When implementing a new feature, update all relevant documentation:
- **`CLAUDE.md`** — Update the architecture tree and any affected sections.
- **`docs/DEVELOPER.md`** — Update the project structure, workflow, API reference, or any technical details that changed.
- **`README.md`** — Update the usage section if the feature is user-facing.

## React Patterns

**Avoid useEffect when possible** (see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)):
- State transitions: Use callbacks instead of Effects watching state changes. Example: `useSocket` accepts `onInitComplete`/`onQueryComplete` callbacks rather than App.tsx using Effects to watch `lastExitCode`.
- DOM manipulation: Use ref callbacks instead of Effects. Example: `CommandOutput` uses a ref callback on the last element to auto-scroll.
- Valid useEffect: Synchronizing with external systems (Socket.IO connection in `useSocket.ts`).