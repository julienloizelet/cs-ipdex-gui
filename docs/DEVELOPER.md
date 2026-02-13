# Developer Guide

This document provides instructions for setting up and developing the CrowdSec CTI GUI.

## Prerequisites

- Node.js 18+
- npm
- A CrowdSec CTI API key ([get one here](https://app.crowdsec.net/cti-api-keys))

## Project Setup

```bash
# Clone the repository
mkdir cs-ipdex-gui
cd cs-ipdex-gui
git clone https://github.com/crowdsecurity/IPDEX-JS.git ./


# Install dependencies
npm install
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

### E2E Tests

```bash
npx playwright test              # Run all e2e tests
npx playwright test --headed     # Run with visible browser
```

Tests are in the `e2e/` directory and use Playwright with a mock CTI server. Shared helpers are in `e2e/helpers.ts` and mock responses in `e2e/fixtures/`.

**Note:** Stop the dev server before running tests, as they start their own server.

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
│   ├── types.ts           # TypeScript types (ReportResult, StatItem, etc.)
│   ├── hooks/
│   │   ├── useSocket.ts   # WebSocket hook for real-time communication
│   │   └── useTheme.ts    # Theme (light/dark) management
│   └── components/
│       ├── Header.tsx         # App header with theme toggle
│       ├── ApiKeyForm.tsx     # Step 1: API key input + PoV Key checkbox
│       ├── IpInputForm.tsx    # Step 2: IP addresses input
│       ├── ConfirmDialog.tsx  # Modal to confirm query before execution
│       ├── CommandOutput.tsx  # Real-time command output
│       └── ReportView.tsx     # Report display with stats cards
│
└── server/                 # Express backend
    ├── index.ts           # Server entry point + WebSocket setup + session state
    └── services/
        └── cti/
            ├── index.ts   # Barrel exports
            ├── types.ts   # CTI API response types
            ├── client.ts  # HTTP client (fetch with retry/backoff)
            ├── report.ts  # Report generation + stats aggregation
            └── csv.ts     # CSV export + tar.gz archive generation
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
| `init` | `apiKey: string` | Store API key in session |
| `createReport` | `{ ips: string[], isPovKey: boolean }` | Query IPs and generate report |
| `downloadReport` | _(none)_ | Download report as `.tar.gz` archive (CSV files) |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `output` | `{ type, data, code? }` | Real-time progress output |
| `reportFile` | `{ data: ArrayBuffer }` | `.tar.gz` archive for download |

Output types:
- `stdout`: Progress messages and JSON results (between `---RESULTS_JSON---` markers)
- `stderr`: Error messages (API errors, rate limits)
- `exit`: Operation completed (includes exit code)
- `error`: Internal error

## Application Workflow

1. **API Key Setup**: User enters CrowdSec CTI API key and optionally checks "Using a PoV Key"
2. **IP Input**: User enters IP addresses (one per line) or uploads a text file. Input is validated to ensure one IP per line format
3. **Confirmation**: Modal asks user to confirm the query (quota warning)
4. **Report Creation**:
   - PoV key: Server queries CTI API in batches of 100 via `GET /smoke?ips=...`
   - Community key: Server queries IPs one at a time via `GET /smoke/{ip}` with rate limiting
   - Progress is streamed to the client in real-time
   - Results are aggregated into statistics
5. **Results Display**: Report displayed with summary stats and cards:
   - Reputation (Malicious, Suspicious, Known, Safe)
   - Top Classifications
   - Top Behaviors
   - Top Blocklists
   - Top CVEs
   - Top IP Ranges
   - Top Autonomous Systems
   - Top Countries
6. **Download**: Exports a `.tar.gz` archive containing two CSV files: `report.csv` (aggregated stats) and `details.csv` (per-IP raw data)

## CTI API Integration

The server calls the CrowdSec CTI API directly (no external binary needed):

- **Base URL**: `https://cti.api.crowdsec.net/v2`
- **Auth**: `x-api-key` header
- **Endpoints used**:
  - `GET /smoke/{ip}` — Single IP lookup (community keys)
  - `GET /smoke?ips=ip1,ip2,...` — Batch lookup (PoV/partner keys)
- **Rate limiting**: 429 responses are retried with exponential backoff (up to 3 retries)
- **Error handling**: 403 (invalid key), 404 (unknown IP, counted as "not found")

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Socket.IO, TypeScript
- **Build**: Vite (frontend), tsc (backend)
- **Runtime**: Node.js 18+
- **HTTP Client**: Native `fetch` (no external dependencies)

## KillerCoda Scenario

The `killercoda/` directory contains an interactive tutorial for [KillerCoda](https://killercoda.com).

### Structure

```
killercoda/
├── index.json      # Scenario configuration
├── intro.md        # Introduction page (prerequisites)
├── finish.md       # Setup page (shown after Start)
├── background.sh   # Installs Node.js and builds the GUI
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