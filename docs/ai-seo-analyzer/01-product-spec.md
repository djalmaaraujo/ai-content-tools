# Product Spec

## Goal

Build an API-only backend that audits a website or webpage for AI search visibility and LLM citation readiness. The service should combine deterministic technical extraction with LLM-based specialist analysis, then return a structured final report.

## Primary User Flow

1. Client submits a URL to `POST /analyze`.
2. API validates and normalizes the URL.
3. API creates an analysis record with status `queued`.
4. API returns an `analysisId` immediately.
5. Background pipeline fetches and parses the target.
6. Three specialist LLM audits run in parallel.
7. Synthesizer LLM creates the final report.
8. Client polls `GET /analyze/:id` until status is `done` or `error`.

## MVP Scope

- Docker-first NestJS API.
- In-memory job store with TTL.
- In-process async pipeline using `@nestjs/event-emitter`.
- Deterministic fetch and parse stage for the target page plus common machine-readable files.
- Provider-neutral LLM specialist and synthesizer calls, with OpenAI Responses API as the default provider.
- Zod validation for every LLM JSON output.
- Provider structured outputs when supported, with Zod as the application-side validation layer.
- Versioned AI bot registry used by every analysis record.
- IP-based rate limiting.
- Unit tests for parsers and service logic.
- E2E test for start/status workflow with mocked LLM calls.

## Explicit Non-Goals For MVP

- User accounts, auth, billing, and per-user quotas.
- UI/frontend.
- Persistent storage.
- Multi-worker queue.
- Full site crawling.
- JavaScript rendering with Playwright.
- Long-running scheduled audits.
- Export formats such as PDF, CSV, or DOCX.

## Success Criteria

- `docker compose up --build` starts the API.
- `POST /analyze` returns an analysis id without waiting for LLM completion.
- `GET /analyze/:id` returns status, progress, timestamps, and result or error.
- Deterministic stage does not crash when optional resources are missing.
- LLM stage rejects invalid JSON before it reaches the final response.
- Tests run inside Docker with one documented command.

## Product Risks

- The original source document normalizes input to URL origin, which discards paths. The implementation should preserve the exact submitted URL for page analysis and use the origin for root-level files.
- The entity specialist needs web search. With OpenAI, this should use the Responses API `web_search` tool. Other providers need equivalent tool support or an external search adapter.
- In-memory state means jobs disappear when the container restarts.
- Without SSRF protections, fetching arbitrary user-supplied URLs can expose internal network targets.
