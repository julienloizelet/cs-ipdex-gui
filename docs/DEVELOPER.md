# Developer Guide

This document provides instructions for setting up and developing the CrowdSec IPdex GUI.

## Prerequisites

- Node.js 18+
- npm
- `ipdex` binary in your PATH (download from [releases](https://github.com/crowdsecurity/ipdex/releases))

## Project Setup

```bash
# Clone the repository
git clone https://github.com/julienloizelet/cs-ipdex-gui.git
cd cs-ipdex-gui

# Install dependencies
npm install
```

Ensure `ipdex` is available in your PATH:

```bash
# Download and install ipdex
curl -fsSL https://github.com/crowdsecurity/ipdex/releases/download/v0.0.12/ipdex_linux_amd64 -o /usr/local/bin/ipdex
chmod +x /usr/local/bin/ipdex

# Verify installation
ipdex version
```

## Development

Start both the backend and frontend in development mode:

```bash
npm run dev
```

This runs concurrently:
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3000

The Vite dev server proxies API and WebSocket requests to the Express backend.

### Individual Commands

```bash
npm run dev:client    # Start Vite dev server only
npm run dev:server    # Start Express server only (with hot reload)
npm run lint          # Run ESLint
```

## Building for Production

```bash
npm run build         # Build both client and server
npm start             # Run production server
```

The production build:
- Compiles React app to `dist/client/`
- Compiles Express server to `dist/server/`
- Express serves the static React build

## Project Structure

```
src/
├── client/                 # React frontend
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Main wizard component
│   ├── index.css          # Tailwind CSS
│   ├── types.ts           # TypeScript types
│   ├── hooks/
│   │   ├── useSocket.ts   # WebSocket hook for real-time communication
│   │   └── useTheme.ts    # Theme (light/dark) management
│   └── components/
│       ├── Header.tsx         # App header with theme toggle
│       ├── ApiKeyForm.tsx     # Step 1: API key input
│       ├── IpInputForm.tsx    # Step 2: IP addresses input
│       ├── CommandOutput.tsx  # Real-time command output
│       └── ResultsView.tsx    # IP threat intelligence display
│
└── server/                 # Express backend
    ├── index.ts           # Server entry point + WebSocket setup
    └── services/
        └── ipdex.ts       # ipdex command execution service
```

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |

### WebSocket Events

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `apiKey: string` | Save API key and test connection |
| `query` | `ips: string[]` | Query IPs against CrowdSec CTI |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `output` | `{ type, data, code? }` | Real-time command output |

Output types:
- `stdout`: Standard output from ipdex
- `stderr`: Error output from ipdex
- `exit`: Command completed (includes exit code)
- `error`: Internal error

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Socket.IO, TypeScript
- **Build**: Vite (frontend), tsc (backend)
- **Runtime**: Node.js 18+

## KillerCoda Scenario

The `killercoda/` directory contains an interactive tutorial for [KillerCoda](https://killercoda.com).

### Structure

```
killercoda/
├── index.json      # Scenario configuration
├── intro.md        # Introduction page (prerequisites)
├── finish.md       # Setup page (shown after Start)
├── background.sh   # Installs Node.js, ipdex, and GUI
└── foreground.sh   # Shows setup progress in terminal
```

### Flow

1. **Intro**: User reads prerequisites, clicks Start
2. **Finish**: Scripts run, terminal shows progress, user clicks GUI link when ready

### Key Configuration

- `index.json`: Defines intro → finish flow (no steps)
- `background.sh`: Spawns setup as detached process to avoid KillerCoda timeout
- `foreground.sh`: Waits for `/tmp/.setup-complete` and shows progress
- GUI link uses `{{TRAFFIC_HOST1_3000}}` variable (replaced by KillerCoda at runtime)

### Testing Locally

KillerCoda scenarios can only be tested on the platform. Push changes to a GitHub repository and link it to KillerCoda.

### Logs

When running on KillerCoda:
- Setup logs: `/var/log/setup.log`
- GUI server logs: `/var/log/ipdex-gui.log`
