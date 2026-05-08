# Implementation Plan

## Phase 0: Planning

Status: done after this docs split is accepted.

- Review source markdown.
- Split scope into specs and plans.
- Capture implementation questions.
- Confirm Docker-first direction.

## Phase 1: Docker-First NestJS Scaffold

Deliverables:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.build.json`
- `nest-cli.json`
- `src/main.ts`
- `src/app.module.ts`
- health endpoint
- `Dockerfile`
- `.dockerignore`
- `compose.yaml`
- `.env.example`
- Jest config

Acceptance:

- `docker compose up --build` starts the API.
- `GET /health` returns `{ "status": "ok" }`.
- `docker compose run --rm api npm test` works.

## Phase 2: Analysis API And In-Memory Pipeline

Deliverables:

- `AnalyzeModule`
- `AnalyzeController`
- `AnalyzeService`
- `AnalysisStore`
- `StartAnalysisDto`
- status DTOs or interfaces
- event handler for `analysis.start`

Acceptance:

- `POST /analyze` returns `202` and an `analysisId`.
- `GET /analyze/:id` returns status records.
- unknown ids return `404`.
- pipeline can run with mocked stages.

## Phase 3: Deterministic Fetch And Parsers

Deliverables:

- `DeterministicService`
- `html.parser.ts`
- `jsonld.parser.ts`
- `robots-txt.parser.ts`
- `sitemap.parser.ts`
- URL safety guard
- fetch timeout and size limits

Acceptance:

- target page fetch produces visible text, headers, metadata, and JSON-LD.
- robots parser produces per-bot access.
- sitemap parser handles valid and invalid XML.
- optional missing files do not fail the job.
- unit tests cover parser edge cases.

## Phase 4: LLM Integration

Deliverables:

- `LlmModule`
- provider-neutral `LlmService`
- `OpenAiService` using the Responses API
- optional `GroqService` adapter if selected by env
- Zod schemas from source doc
- prompt modules from source doc
- `SpecialistService`
- `SynthesizerService`
- provider structured outputs
- Zod validation retry
- mocked LLM tests

Acceptance:

- specialist calls validate JSON with Zod.
- invalid LLM JSON fails predictably or retries once when provider-level structured output is unavailable.
- final report follows `FinalReportSchema`.
- tests do not require a real provider API key.

## Phase 5: End-To-End Pipeline

Deliverables:

- real pipeline wiring.
- progress updates.
- stage-level error messages.
- configurable timeouts.
- optional cache by normalized URL if approved.

Acceptance:

- `POST /analyze` starts background work.
- `GET /analyze/:id` progresses through lifecycle.
- successful mocked run ends at `done`.
- failed mocked run ends at `error`.

## Phase 6: Hardening

Deliverables:

- SSRF protections enabled by default.
- rate limit if requested.
- CORS if requested.
- structured logging.
- graceful shutdown.
- production Docker target.

Acceptance:

- URL validation accepts domain hostnames only and rejects IP literals.
- private/internal resolved addresses and redirects are blocked.
- logs identify stage failures without dumping secrets.
- Docker production image runs compiled app.

## Phase 7: Optional Scale Upgrade

Only start after MVP is stable.

- BullMQ.
- Redis.
- persisted analysis records.
- Postgres.
- auth and billing.
- UI.

## Implementation Rule

No code implementation should start until the open questions in `08-open-questions.md` are answered or explicitly deferred.
