# Docker Runtime Spec

## Principle

Docker is the default development, test, and runtime environment. The host machine should only need Docker and Docker Compose.

## Expected Files

- `Dockerfile`
- `.dockerignore`
- `compose.yaml`
- `.env.example`

## Dockerfile Shape

Use a multi-stage Dockerfile:

- `base`: Node image, workdir, non-root user setup.
- `deps`: install dependencies from lockfile.
- `dev`: installs dev dependencies and runs hot reload.
- `build`: compiles TypeScript.
- `production`: runs compiled `dist` with production dependencies.

Recommended base image:

- `node:22-bookworm-slim`

This can be changed before implementation if the project standard is Node 24 or another version.

## Compose Services

### `api`

- Builds the local Dockerfile.
- Uses the `dev` target by default.
- Runs `npm run start:dev`.
- Exposes `${PORT:-3000}:3000`.
- Loads `.env`.
- Mounts source as a bind mount.
- Uses a named volume for `/app/node_modules`.

### Future Optional Services

Keep out of MVP unless requested:

- `redis` for BullMQ and cache.
- `postgres` for persisted analysis records.

If added now, they should be behind Compose profiles so the default MVP stays simple.

## Developer Commands

Start API:

```bash
docker compose up --build
```

Run tests:

```bash
docker compose run --rm api npm test
```

Run e2e tests:

```bash
docker compose run --rm api npm run test:e2e
```

Run lint:

```bash
docker compose run --rm api npm run lint
```

Install dependencies:

```bash
docker compose run --rm api npm install <package>
```

## Environment Variables

`.env.example` should include:

```bash
PORT=3000
NODE_ENV=development
LLM_PROVIDER=openai
OPENAI_API_KEY=
GROQ_API_KEY=
SPECIALIST_MODEL_TECHNICAL=gpt-5.4-mini
SPECIALIST_MODEL_CONTENT=gpt-5.4-mini
SPECIALIST_MODEL_ENTITY=gpt-5.4-mini
SYNTHESIZER_MODEL=gpt-5.4-mini
HTTP_TIMEOUT_MS=10000
ANALYSIS_TTL_MS=86400000
REPORT_LANGUAGE=en
```

## Health Check

Add a lightweight endpoint:

- `GET /health`

Response:

```json
{
  "status": "ok"
}
```

Docker health check should call this endpoint.

## Production Runtime

Production should use the `production` Dockerfile target and run compiled JavaScript:

```bash
docker build --target production -t ai-seo-analyzer-api .
docker run --env-file .env -p 3000:3000 ai-seo-analyzer-api
```

## Docker Acceptance Criteria

- `docker compose up --build` works from a clean clone.
- No host `npm install` is required.
- `node_modules` does not leak into the repo.
- Tests and lint run through Compose.
- Production image starts without dev dependencies.
