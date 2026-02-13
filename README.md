# CrowdSec IPdex

A web GUI for querying IP threat intelligence from the [CrowdSec CTI](https://www.crowdsec.net/cyber-threat-intelligence) database. Paste a list of IPs (or upload a file), and get an aggregated report with reputation scores, behaviors, classifications, blocklists, CVEs, and more.

## Prerequisites

- **Node.js 18+**
- A **CrowdSec CTI API key** — get one from the [CrowdSec Console](https://app.crowdsec.net/settings/cti-api-keys)

Both community keys and Proof of Value (PoV) keys are supported. PoV keys allow batch lookups and higher rate limits.

## Quick Start

```bash
git clone https://github.com/crowdsecurity/IPDEX-JS.git cs-ipdex-gui
cd cs-ipdex-gui
npm install
npm run build
npm start
```

Then open http://localhost:3000 in your browser.

## Usage

1. **Enter your API key** — Paste your CrowdSec CTI API key. Check "Using a PoV Key" if you have one.
2. **Add IP addresses** — Type or paste IPs (one per line), or upload a `.txt` file. Duplicates are detected and reported before querying.
3. **Confirm and run** — Review the IP count and confirm. Progress is displayed in real time as IPs are queried.
4. **View results** — The report shows aggregated statistics:
   - Reputation breakdown (Malicious, Suspicious, Known, Safe)
   - Top Classifications, Behaviors, and Blocklists
   - Top CVEs, IP Ranges, Autonomous Systems, and Countries
5. **Download** — Export the report as a `.tar.gz` archive containing two CSV files (`report.csv` for aggregated stats, `details.csv` for per-IP data).

## Development

See [`docs/DEVELOPER.md`](docs/DEVELOPER.md) for setup instructions, architecture details, and API reference.

```bash
npm run dev    # Start dev servers (frontend :5173, backend :3000)
npm run lint   # Run ESLint
```

## License

See [LICENSE](LICENSE).