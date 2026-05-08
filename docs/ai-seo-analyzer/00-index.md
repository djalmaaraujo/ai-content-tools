# AI SEO Analyzer Docs

Source document: `/Users/djalmaaraujo/Desktop/ai-seo-analyzer-nestjs.md`

This folder breaks the original NestJS skeleton into implementation-ready specs and plans. The target repo is currently empty, so the implementation plan assumes a greenfield project.

## Documents

- [01-product-spec.md](01-product-spec.md): product scope, MVP boundaries, and success criteria.
- [02-architecture-spec.md](02-architecture-spec.md): NestJS modules, pipeline stages, service boundaries, and data flow.
- [03-api-contract-spec.md](03-api-contract-spec.md): HTTP endpoints, DTOs, status lifecycle, and response shapes.
- [04-deterministic-stage-spec.md](04-deterministic-stage-spec.md): fetch policy, parsers, deterministic output contract, and failure behavior.
- [05-llm-stage-spec.md](05-llm-stage-spec.md): Anthropic integration, model configuration, prompts, schema validation, and LLM failure handling.
- [06-docker-runtime-spec.md](06-docker-runtime-spec.md): Docker-first development, test, and production runtime.
- [07-implementation-plan.md](07-implementation-plan.md): phased build plan, acceptance criteria, and verification steps.
- [08-open-questions.md](08-open-questions.md): questions to answer before code implementation starts.
- [09-decisions.md](09-decisions.md): decisions confirmed after review, including Docker, URL scope, LLM provider, bot registry, and safety.

## Current Direction

Build a Docker-first NestJS API that accepts an exact URL, creates an asynchronous analysis job, runs deterministic HTTP page checks, runs three structured-output LLM specialist audits, synthesizes the final report in English, and exposes polling for job status.

No host Node.js installation should be required for normal development or testing. Docker Compose is the primary interface.
