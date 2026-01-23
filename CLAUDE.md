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
```

## Architecture

```
src/
├── client/              # React frontend
│   ├── App.tsx          # Main wizard orchestrator (api-key → ip-input → executing → results)
│   ├── hooks/useSocket.ts   # Socket.IO connection and state management
│   └── components/      # Step components (ApiKeyForm, IpInputForm, CommandOutput, ResultsView)
└── server/
    ├── index.ts         # Express + Socket.IO setup + per-socket session state
    └── services/cti/
        ├── client.ts    # HTTP client (fetch with retry/backoff)
        ├── report.ts    # Report generation + stats aggregation
        └── types.ts     # CTI API response types
```

**Wizard Flow**: API key setup → IP input → Query execution → Results display

**Real-time Communication**: Socket.IO streams progress from server to client. Client emits `init` (API key) or `createReport` (IPs array), server responds with `output` events.

**CTI Integration**: Server queries CrowdSec CTI API (`https://cti.api.crowdsec.net/v2`) directly via fetch. PoV keys use batch endpoint, community keys use single-IP endpoint with rate limiting. Results are aggregated into stats and sent via JSON markers in output.

## React Patterns

**Avoid useEffect when possible** (see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)):
- State transitions: Use callbacks instead of Effects watching state changes. Example: `useSocket` accepts `onInitComplete`/`onQueryComplete` callbacks rather than App.tsx using Effects to watch `lastExitCode`.
- DOM manipulation: Use ref callbacks instead of Effects. Example: `CommandOutput` uses a ref callback on the last element to auto-scroll.
- Valid useEffect: Synchronizing with external systems (Socket.IO connection in `useSocket.ts`).