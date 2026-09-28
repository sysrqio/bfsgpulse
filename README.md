# bfsgpulse

**BFSG/EAA accessibility evidence CLI** — run WCAG 2.x audits (via [pa11y-ci](https://github.com/pa11y/pa11y-ci)) and map findings to **BFSG / EN 301 549**-style references for CI and compliance workflows.

- Zero telemetry, no cloud upload
- Offline-friendly tests via `--fixture` or `BFSGPULSE_FIXTURE`
- Exit codes designed for CI gates

## Install

```bash
npm install -g @sysrqio/bfsgpulse
# or
npx @sysrqio/bfsgpulse audit --help
```

Requires **Node.js 20+**. Live scans need Chromium (bundled with pa11y-ci / Puppeteer).

## Quick start

```bash
bfsgpulse init
bfsgpulse audit --config .bfsgpulse.json --output markdown --out-file report.md
```

### Offline / CI fixture mode

```bash
export BFSGPULSE_FIXTURE=./test/fixtures/sample-violations.json
bfsgpulse audit --urls https://example.com --output json
```

## Commands

| Command | Description |
| --- | --- |
| `bfsgpulse audit` | Run accessibility scan |
| `bfsgpulse init` | Write sample `.bfsgpulse.json` |
| `bfsgpulse version` | Print version |

### `audit` flags

| Flag | Default | Description |
| --- | --- | --- |
| `--config` | `.bfsgpulse.json` | Config path |
| `--urls` | — | Comma-separated URLs |
| `--sitemap` | — | Sitemap URL |
| `--standard` | `WCAG2AA` | `WCAG2A`, `WCAG2AA`, `WCAG2AAA` |
| `--runner` | `axe` | `axe` or `htmlcs` |
| `--threshold` | `0` | Max allowed violations |
| `--output` | `text` | `text`, `json`, `markdown` |
| `--out-file` | — | Write report to file |
| `--fixture` | — | Pa11y JSON results (skip browser) |
| `--no-color` | — | Plain text output |

### Exit codes

| Code | Meaning |
| ---: | --- |
| `0` | Violations ≤ threshold |
| `2` | Violations > threshold |
| `1` | Runtime error (config, pa11y, network) |

## Config example

```json
{
  "urls": ["https://example.com/", "https://example.com/checkout"],
  "defaults": {
    "standard": "WCAG2AA",
    "runners": ["axe"],
    "concurrency": 4,
    "timeout": 60000
  }
}
```

## Development

```bash
npm install
npm test
npm run build
node dist/cli.js version
```

## License

MIT — see [LICENSE](LICENSE).

## Module paths

- npm: `@sysrqio/bfsgpulse`
- Go module path (for related tooling): `github.com/sysrqio/bfsgpulse`
