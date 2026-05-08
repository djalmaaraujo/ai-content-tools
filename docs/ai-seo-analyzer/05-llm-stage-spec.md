# LLM Stage Spec

## Purpose

Run structured LLM analysis on top of deterministic evidence, then validate all generated JSON before it reaches the API response.

## Provider Strategy

Default provider: OpenAI Responses API.

Reason: this app needs reliable structured reports, optional web search for the entity specialist, and low-cost model options. OpenAI's current API supports Structured Outputs and the Responses API web search tool. Groq remains useful as a low-cost optional adapter for non-search specialists, but its strict structured outputs and tool support are more constrained by model and mode.

The wrapper should expose a provider-neutral method:

```ts
runStructuredCall<T>(args: {
  model: string;
  system: string;
  userMessage: string;
  schemaName: string;
  schema: unknown;
  tools: Array<'web_search' | 'web_fetch'>;
  maxTokens: number;
}): Promise<T>
```

Zod remains the application-side validator even when the provider offers strict JSON schema output.

## Provider Notes

### OpenAI

- Use the Responses API.
- Use Structured Outputs through JSON schema.
- Use `web_search` for the entity specialist.
- Prefer lower-cost mini/nano models unless quality testing proves they are insufficient.

### Groq

- Keep as an optional adapter.
- Useful for cheap/fast non-search specialist calls.
- Strict structured outputs are model-limited.
- JSON Object Mode is not enough by itself because it guarantees JSON syntax, not schema correctness.
- If Groq is used, still validate with Zod and retry on schema mismatch.

### Anthropic

- Keep as a future adapter if needed.
- Anthropic now has structured outputs support, but it is no longer the default for this plan.

References:

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/tools-web-search
- https://developers.openai.com/api/docs/models
- https://console.groq.com/docs/structured-outputs
- https://groq.com/pricing
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs

## Proposed Model Defaults

Use env vars for all models:

- `LLM_PROVIDER=openai`
- `SPECIALIST_MODEL_TECHNICAL`
- `SPECIALIST_MODEL_CONTENT`
- `SPECIALIST_MODEL_ENTITY`
- `SYNTHESIZER_MODEL`

Proposed defaults:

- Technical specialist: `gpt-5.4-mini`
- Content/GEO specialist: `gpt-5.4-mini`
- Entity specialist: `gpt-5.4-mini` with web search enabled
- Synthesizer: `gpt-5.4-mini`

Use stronger models only if evaluation shows the mini model misses important findings. The deterministic parser should carry most technical facts, so this product should not require a frontier model for every stage.

## Specialist Audits

### Technical Specialist

Input:

- Target URL.
- Deterministic HTML metadata.
- Headers.
- robots.txt content and parsed bot access.
- sitemap status.
- JSON-LD blocks.

Output schema: `TechnicalAuditSchema`.

### Content/GEO Specialist

Input:

- Visible text.
- Headings.
- `llms.txt`.
- `llms-full.txt`.
- Basic metadata.

Output schema: `ContentAuditSchema`.

### Entity Specialist

Input:

- Brand name.
- Domain.
- Organization schema if present.

Tools:

- `web_search` enabled.
- `web_fetch` optional only for providers that support it and only if implementation sends candidate URLs in context.

Output schema: `EntityAuditSchema`.

Entity/brand means the external knowledge graph strength of the site owner or brand. It answers questions like: is the brand consistently recognized across the web, does it have Wikipedia/Wikidata presence, does it appear in authoritative sources, and can an LLM confidently distinguish this brand from similarly named entities?

## Synthesizer

Input:

- URL.
- Deterministic summary.
- Technical audit.
- Content audit.
- Entity audit.

Output schema: `FinalReportSchema`.

The synthesizer calculates the final weighted score:

- `crawler_access`: 25%
- `llms_files`: 15%
- `renderability`: 15%
- `structured_data`: 15%
- `technical_hygiene`: 10%
- `geo_signals`: 10%
- `entity_strength`: 5%
- `eeat`: 5%

## JSON Handling

Every LLM call must:

1. Use provider structured outputs when available.
2. Validate the parsed output with Zod.
3. Retry once with a repair prompt if provider structured output is unavailable or Zod validation fails.
4. Store the validation error if retry fails.

## Prompt Modules

Prompts from the source document should become importable TypeScript modules:

- `technical-auditor.prompt.ts`
- `content-geo.prompt.ts`
- `entity-strategist.prompt.ts`
- `synthesizer.prompt.ts`

Before implementation, prompts should be adjusted so deterministic facts are not re-derived by the LLM when the code can provide them.

## LLM Failure Decisions

MVP decision: strict mode. Any specialist failure fails the analysis.

Future option: degraded mode, where a failed specialist is replaced with a structured partial result and the final report includes uncertainty notes.
