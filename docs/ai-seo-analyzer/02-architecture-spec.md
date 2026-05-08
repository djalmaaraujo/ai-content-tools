# Architecture Spec

## Runtime Shape

The API runs as a single NestJS process inside Docker. The MVP uses in-memory state and in-process events, so one container instance owns all queued and running analyses.

```
Client
  |
  | POST /analyze
  v
AnalyzeController
  |
  v
AnalyzeService.startAnalysis()
  |
  +-> AnalysisStore.create(status=queued)
  +-> EventEmitter2.emit("analysis.start")
  |
  v
Client receives { analysisId }

Event handler:
  DeterministicService.run()
    -> SpecialistService.runTechnical()
    -> SpecialistService.runContent()
    -> SpecialistService.runEntity()
  SynthesizerService.run()
  AnalysisStore.update(status=done, result)
```

## NestJS Modules

- `AppModule`
  - Imports `EventEmitterModule.forRoot()`.
  - Imports `AnalyzeModule`.
  - Imports `LlmModule`.
- `AnalyzeModule`
  - Owns controller, store, pipeline orchestration, deterministic stage, specialist stage, synthesizer stage, parsers, and result schemas.
- `LlmModule`
  - Owns provider-specific LLM services.
  - Exports a stable structured-output interface for specialist and synthesizer services.
  - Defaults to OpenAI Responses API.

## Core Services

- `AnalyzeController`
  - HTTP boundary.
  - Does not run pipeline logic.
- `AnalyzeService`
  - Creates jobs.
  - Emits `analysis.start`.
  - Owns pipeline status transitions.
- `AnalysisStore`
  - In-memory `Map`.
  - TTL-based cleanup.
  - No persistence guarantees.
- `DeterministicService`
  - Fetches target resources.
  - Calls parsers.
  - Produces structured deterministic evidence.
- `SpecialistService`
  - Runs technical, content/GEO, and entity specialists.
  - Validates specialist JSON with Zod.
- `SynthesizerService`
  - Runs the final report synthesis.
  - Validates final report JSON with Zod.
- `AnthropicService`
  - Wraps `@anthropic-ai/sdk`.
  - Converts internal tool settings to Anthropic Messages API tool definitions.

## Data Boundaries

The deterministic stage should capture facts and evidence. LLM stages should evaluate and explain those facts.

For reliability, implementation should prefer deterministic code for:

- URL normalization.
- HTTP status, headers, and redirects.
- HTML metadata extraction.
- Visible text extraction.
- JSON-LD parsing.
- robots.txt allow/block checks.
- sitemap validity and URL count.
- Basic score inputs such as text length, HTML size, and missing files.

The LLM should handle:

- Qualitative content/GEO review.
- Entity strength review using web search.
- Findings phrasing.
- Recommendation prioritization.
- Executive synthesis.

## Failure Behavior

- If URL validation fails, return HTTP 400 before a job is created.
- If target page fetch fails, job should end as `error` unless graceful degradation is enabled.
- If optional files fail, record their status and continue.
- If one specialist fails, the MVP fails the whole analysis.
- If LLM JSON validation fails, retry once with a repair prompt, then fail the stage if still invalid.

## Migration Path

MVP:

- `EventEmitter2`.
- In-memory `AnalysisStore`.
- Single Docker container.

Next scale step:

- Replace event emitter with BullMQ.
- Replace in-memory store with Redis or Postgres-backed records.
- Keep controller and stage service signatures stable.
