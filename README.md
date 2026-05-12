# AI Content Tools

Open-source AI SEO analyzer for checking whether a website is ready for AI search, LLM crawlers, and generative engine citations.

The project is a Docker-first NestJS API. It fetches a URL, runs deterministic technical checks, sends structured evidence to LLM specialist auditors, and returns a scored report with concrete recommendations.

## What It Checks

- AI crawler access through `robots.txt`.
- Search and AI bot coverage for OpenAI, Anthropic, Perplexity, Google, Microsoft, Apple, Amazon, Common Crawl, Meta, and others.
- HTML metadata: title, description, canonical, Open Graph, Twitter Card, viewport, language.
- Semantic HTML and heading structure.
- JSON-LD structured data.
- Sitemap health.
- `llms.txt` and `llms-full.txt`.
- Renderability signals from raw HTTP HTML.
- Content/GEO readiness for LLM citations.
- Brand/entity strength using web search.
- Prioritized recommendations grouped by quick wins, strategic work, and nice-to-have improvements.

## Current Status

This is an early MVP. It is API-first and self-hostable with Docker Compose.

Included:

- NestJS API.
- Docker Compose runtime.
- In-memory async analysis queue.
- Deterministic HTTP parser stage.
- Versioned AI bot registry.
- OpenAI Responses API provider with Structured Outputs.
- Zod validation for all LLM results.
- Server-rendered HTML report endpoint.
- Unit and API e2e tests.

Not included yet:

- Web dashboard.
- PDF/export.
- Persistent database.
- Redis/BullMQ workers.
- Browser rendering.
- Auth/billing.

## Requirements

- Docker
- Docker Compose
- OpenAI API key for live LLM analysis

No host Node.js install is required for normal usage.

## Quick Start

Clone the repository:

```bash
git clone git@github.com:djalmaaraujo/ai-content-tools.git
cd ai-content-tools
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
OPENAI_API_KEY=your_key_here
```

Start the API:

```bash
docker compose up --build
```

The API will be available at:

```bash
http://localhost:3000
```

Check health:

```bash
curl http://localhost:3000/health
```

## Run An Analysis

Start an analysis:

```bash
curl -sS -X POST http://localhost:3000/analyze \
  -H 'content-type: application/json' \
  -d '{"url":"example.com"}'
```

Response:

```json
{
  "analysisId": "abc123"
}
```

Poll the result:

```bash
curl http://localhost:3000/analyze/abc123
```

Lifecycle:

- `queued`
- `fetching`
- `analyzing`
- `synthesizing`
- `done`
- `error`

## API

### `GET /health`

Returns:

```json
{
  "status": "ok"
}
```

### `POST /analyze`

Request:

```json
{
  "url": "https://example.com/blog/post"
}
```

Response:

```json
{
  "analysisId": "abc123"
}
```

### `GET /analyze/:id`

Returns the current analysis record, including progress, final result, or stage error.

### `GET /analyze/:id/report`

Returns a server-rendered HTML report for completed analyses. The JSON API remains the source of truth; this endpoint is only a human-readable view.

The report uses Tailwind via CDN for now, so no separate frontend build is required.

## URL Safety

The analyzer accepts domain hostnames only. IP literals are rejected.

Rejected examples:

- `http://127.0.0.1`
- `http://192.168.0.10`
- `http://[::1]`
- `http://localhost`
- `http://intranet`

The app also validates DNS resolution and redirect destinations to avoid internal/private network fetches.

## Configuration

See [.env.example](.env.example).

Important variables:

```bash
PORT=3000
OPENAI_API_KEY=
SPECIALIST_MODEL_TECHNICAL=gpt-5.4-mini
SPECIALIST_MODEL_CONTENT=gpt-5.4-mini
SPECIALIST_MODEL_ENTITY=gpt-5.4-mini
SYNTHESIZER_MODEL=gpt-5.4-mini
HTTP_TIMEOUT_MS=10000
ANALYSIS_TTL_MS=86400000
REPORT_LANGUAGE=en
HTTP_PROXY_URL=
HTTPS_PROXY=
USER_AGENT_POOL=
ENABLE_WEB_SEARCH=true
```

### Outbound proxy and User-Agent rotation

To reduce the risk of being rate-limited or blocked when scanning many sites:

- Set `HTTP_PROXY_URL` (or `HTTPS_PROXY`) to route deterministic fetches through an HTTP/HTTPS proxy. The OpenAI specialist calls are unaffected because they leave OpenAI's network, not yours.
- Set `USER_AGENT_POOL` to a comma-separated list of User-Agent strings. The deterministic fetcher rotates through them per request. When unset it falls back to `AIContentToolsBot/0.1`.

### Disabling OpenAI `web_search`

The entity specialist normally calls OpenAI's `web_search` tool to look up Wikipedia, Wikidata, and authority mentions. That tool call is billed in addition to the model tokens.

Set `ENABLE_WEB_SEARCH=false` to run a cheaper variant: the entity specialist still uses the LLM, but only reasons from the page's JSON-LD Organization schema, brand name, and domain. Brand-strength judgments will be lower confidence; the rest of the report is unchanged.

Tests do not require `OPENAI_API_KEY`. Live analysis does.

## Development

Run the full local verification bar through Docker Compose:

```bash
docker compose run --rm api npm test
docker compose run --rm api npm run test:e2e
docker compose run --rm api npm run lint
docker compose run --rm api npm run typecheck
```

No branch may be pushed unless the entire suite above passes locally. Do not skip a failing check because the change seems unrelated.

## Architecture

High-level flow:

```text
POST /analyze
  -> create in-memory analysis record
  -> emit analysis.start
  -> deterministic HTTP fetch + parsing
  -> technical specialist
  -> content/GEO specialist
  -> entity/brand specialist with web search
  -> synthesizer
  -> final structured report
```

Root-level files are fetched from the URL origin:

- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `llms-full.txt`

The exact submitted URL is used for page HTML/content analysis.

## Project Docs

Implementation specs live in [docs/ai-seo-analyzer](docs/ai-seo-analyzer).

Development rules live in [AGENTS.md](AGENTS.md).

## Funding

If this project helps you, consider supporting development:

- Buy Me a Coffee: https://www.buymeacoffee.com/djalmaaraujo
- GitHub: https://github.com/sponsors/djalmaaraujo

## Contributing

Contributions are welcome. Keep changes small, tested, and aligned with the Docker-first workflow.

Before opening a PR:

```bash
docker compose run --rm api npm test
docker compose run --rm api npm run test:e2e
docker compose run --rm api npm run lint
docker compose run --rm api npm run typecheck
```

The same rule applies before every push: all checks must be green.

Use Conventional Commits:

- `feat:`
- `fix:`
- `docs:`
- `test:`
- `refactor:`
- `build:`
- `ci:`
- `chore:`

## License

MIT. See [LICENSE](LICENSE).
