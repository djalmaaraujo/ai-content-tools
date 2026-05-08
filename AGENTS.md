# AI SEO Analyzer — Development Rules

Project: AI SEO Analyzer. Greenfield standalone NestJS API. Docker-first. Not a continuation of any past project.

## Core Workflow

1. TDD is the default workflow: write the failing test first, then implementation, then refactor.
2. Unit tests are required for parser logic, URL validation, scoring helpers, DTO/schema validation, and pure utilities.
3. API e2e tests are required for every HTTP behavior change.
4. No commit, push, or PR may happen while the local test suite is red.
5. "I did not touch that code" is not an excuse for pushing a red branch. Fix it, revert your own change, or clearly surface the blocker before pushing.
6. Never commit a test file without running it first. If a test cannot be run, report it as blocked instead of pretending it passed.
7. Conventional Commits are mandatory: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`. Keep the subject at 72 characters or less.

## Docker-First Development

All normal development and verification runs through Docker Compose. Do not require host Node.js, host npm, or host package installs.

Expected commands once the scaffold exists:

```bash
docker compose up --build
docker compose run --rm api npm test
docker compose run --rm api npm run test:e2e
docker compose run --rm api npm run lint
docker compose run --rm api npm run typecheck
```

If a command name changes during implementation, update this file in the same PR.

## Pre-Push Bar

Before any branch is pushed, all applicable checks must pass:

```bash
docker compose run --rm api npm test
docker compose run --rm api npm run test:e2e
docker compose run --rm api npm run lint
docker compose run --rm api npm run typecheck
```

No skipping. If the suite is red, do not push.

## Stack

- Backend: NestJS + TypeScript.
- Runtime: Docker Compose.
- Queue for MVP: `@nestjs/event-emitter`.
- Store for MVP: in-memory `Map` with TTL.
- HTTP fetch: `undici`.
- HTML parsing: `cheerio`.
- robots.txt parsing: `robots-parser`.
- XML parsing: `fast-xml-parser`.
- Validation: Zod.
- LLM default: provider-neutral interface with OpenAI Responses API as the first provider.
- Tests: Jest for unit and NestJS e2e with supertest.

## Testing Philosophy

- Test behavior, not implementation details.
- Unit test pure functions and deterministic parsing thoroughly.
- E2E tests hit the public HTTP API.
- E2E tests must not depend on fixture files when behavior can be created through API calls.
- Never mock our own application code in e2e tests.
- Mock third-party LLM/network calls through a dedicated adapter or test provider.
- Parser fixtures are allowed for unit tests when they represent external file formats such as HTML, JSON-LD, `robots.txt`, and sitemap XML.

## Required Test Coverage

Add or update tests when touching:

- URL/domain validation and SSRF protection.
- HTTP fetch behavior, redirects, timeouts, and response-size limits.
- HTML metadata extraction.
- JSON-LD extraction.
- `robots.txt` bot access logic.
- sitemap parsing.
- AI bot registry versioning.
- Zod schemas and structured LLM outputs.
- analysis lifecycle: `queued`, `fetching`, `analyzing`, `synthesizing`, `done`, `error`.
- API endpoints: `POST /analyze`, `GET /analyze/:id`, `GET /health`.

## Project Constraints

- Accept only domain hostnames as analysis targets. Never accept IP literals.
- Root-level resources come from the URL origin: `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`.
- The exact submitted URL is used for page HTML/content analysis.
- Keep the MVP HTTP-only. Do not add Playwright/browser rendering unless explicitly requested.
- Keep Compose to the API service only for MVP. Do not add Redis/Postgres unless the plan changes.
- Use a versioned AI bot registry. Every analysis record must store the registry version used.
- Final reports are in English unless the product spec changes.
- Use provider structured outputs when available, but always validate with Zod.
- Do not use `any` unless there is no reasonable alternative and the reason is documented locally.
- Do not use `// @ts-ignore` without a linked issue or explicit explanation.
- Avoid broad abstractions before the codebase demonstrates a real need.

## Feature Workflow

1. Write or update the failing unit test for deterministic logic.
2. Write or update the failing API e2e test for endpoint behavior.
3. Implement the smallest code change that satisfies the tests.
4. Refactor while keeping tests green.
5. Run the full pre-push bar through Docker Compose.
6. Commit with a Conventional Commit message.

## Pull Requests

Every PR should include:

1. Summary: what changed and why.
2. Before / After: API-visible behavior before and after the change.
3. Testing: exact Docker commands run and their result.

Do not open a PR unless the applicable Docker test suite is green.

## What Not To Do

- Do not push with failing tests.
- Do not skip tests because a change seems small.
- Do not add a UI, browser renderer, database, Redis, BullMQ, auth, billing, or export system unless explicitly requested.
- Do not hard-code current AI bot lists directly inside parser logic; use the versioned registry.
- Do not make LLM output trusted just because the provider returned JSON; validate with Zod.
- Do not introduce host-machine setup requirements.
- Do not add libraries without checking whether the standard Node/NestJS stack already covers the need.
- Do not write features "just in case."

