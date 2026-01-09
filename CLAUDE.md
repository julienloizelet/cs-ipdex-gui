# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GUI application for the ipdex tool (CrowdSec CTI IP lookup). Built with React + Vite frontend and Express + Socket.IO backend.

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
    ├── index.ts         # Express + Socket.IO setup
    └── services/ipdex.ts    # ipdex binary execution
```

**Wizard Flow**: API key setup → IP input → Query execution → Results display

**Real-time Communication**: Socket.IO streams command output from server to client. Client emits `init` (API key) or `query` (IPs array), server responds with `output` events.

**ipdex Integration**: Server spawns ipdex binary, captures stdout/stderr, and streams to client. Results are parsed from JSON markers in output.

## React Patterns

**Avoid useEffect when possible** (see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)):
- State transitions: Use callbacks instead of Effects watching state changes. Example: `useSocket` accepts `onInitComplete`/`onQueryComplete` callbacks rather than App.tsx using Effects to watch `lastExitCode`.
- DOM manipulation: Use ref callbacks instead of Effects. Example: `CommandOutput` uses a ref callback on the last element to auto-scroll.
- Valid useEffect: Synchronizing with external systems (Socket.IO connection in `useSocket.ts`).