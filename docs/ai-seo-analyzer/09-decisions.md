# Confirmed Decisions

Date: 2026-05-07

## Scope

- Analyze the exact submitted URL for page content and HTML evidence.
- Fetch root-level files from the URL origin: `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt`.
- Use HTTP-only analysis for the MVP.
- Do not include Playwright/browser rendering in MVP.
- Detect JavaScript dependency from raw HTML evidence and report it as a finding.

## Runtime

- Docker-first.
- Compose includes only the API service for MVP.
- No Redis/Postgres in MVP.
- Use `EventEmitter2` and an in-memory `Map` store.

## Pipeline

- If any LLM specialist fails, the MVP analysis fails.
- Partial/degraded reports can be added later.
- Final report language: English.
- Rate limiting is included in MVP.
- `GET /analyze/:id` returns status and final result by default.
- Intermediate deterministic evidence may be exposed only behind a development/debug flag.

## LLM Provider

- Use a provider-neutral interface.
- Default provider: OpenAI Responses API.
- Use provider structured outputs wherever supported.
- Validate every output with Zod even if the provider uses strict schemas.
- Groq may be added as an optional adapter for low-cost non-search specialist calls.
- Anthropic is no longer the default provider, but the architecture should not prevent a future adapter.

## Model Profile

- The app should not require a large frontier model for every stage.
- Deterministic code extracts most technical evidence.
- Use a lower-cost structured-output-capable model by default.
- Proposed OpenAI default: `gpt-5.4-mini` for technical, content, entity, and synthesizer.
- Upgrade only selected stages if evaluation shows quality gaps.

## Entity/Brand Analysis

Entity/brand analysis means checking whether the site owner or brand is a recognizable web entity. It looks for signals such as Wikipedia, Wikidata, authoritative mentions, consistent naming, and whether LLMs can distinguish the brand from similarly named entities.

This stage needs web search.

## URL Safety

- Accept only domain hostnames, never IP literals.
- Reject IPv4 literals, IPv6 literals, localhost, single-label hosts, and numeric hostnames before fetching.
- Block private/internal resolved addresses and redirects.
- This is not determined by `robots.txt`.
- Enforce it by URL parsing, protocol checks, DNS resolution, IP range checks, and redirect validation.
- Headers may provide evidence, but they are not enough for SSRF protection.

## Bot Registry

- Use a versioned bot registry.
- New runs use the latest registry version.
- Each analysis record stores the registry version used.
- Include the expanded AI bot list from the planning discussion.
- Include metadata for category, vendor, purpose, and `robots.txt` limitations.

## Bot Access Limitations

- `robots.txt` is a critical signal but not the only explanation.
- Some user-triggered fetch agents may not follow `robots.txt` in the same way as autonomous crawlers.
- The final report should explain these limitations instead of presenting all bot access checks as equally definitive.
