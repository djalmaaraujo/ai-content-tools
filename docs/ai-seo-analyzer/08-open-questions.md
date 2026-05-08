# Open Questions Before Implementation

Most questions below have been answered and moved into [09-decisions.md](09-decisions.md). Keep this file as the historical question list.

1. Should an analysis target the exact submitted URL, or always collapse to the domain homepage?

   The source doc uses `new URL(input).origin`, which turns `https://site.com/blog/post` into `https://site.com`. For content/GEO audits, exact-page analysis is usually more useful.

2. Should the MVP fail the whole analysis when one LLM specialist fails, or produce a partial report with uncertainty notes?

   Strict failure is simpler. Partial reports are better for users but need fallback schemas.

3. Should we keep the MVP single-process with `EventEmitter2` and in-memory `Map`, or include Redis/BullMQ from day one because everything is Docker-based?

   Docker makes Redis easy, but BullMQ adds setup and test surface. The source doc recommends EventEmitter2 first.

4. Which model/cost profile should we use by default?

   Proposed default: Haiku for technical/content, Sonnet for entity/synthesizer. Opus for synthesizer is higher quality but higher cost.

5. Is Anthropic the only provider for the first implementation?

   The source doc mentions a future OpenAI-compatible local model adapter. I can keep the interface provider-neutral while only implementing Anthropic now.

6. Will the Anthropic API key have web search enabled?

   The entity specialist depends on Anthropic web search. If it is not enabled, we need either a no-search entity mode or a separate search provider.

7. Should private/internal URLs ever be allowed?

   Default should be no. For safety, the API should block localhost, private IP ranges, link-local ranges, and private redirect destinations.

8. Should the API expose intermediate deterministic evidence in `GET /analyze/:id`?

   Useful for debugging and calibration, but it can make responses large and may expose page content.

9. What report language should the final output use?

   The prompts are in English. We can make output language configurable, default English, or default Portuguese.

10. Should `llms.txt` and `llms-full.txt` be analyzed from the domain root even for exact-page audits?

    Proposed answer: yes. Target page content comes from the exact URL; machine-readable files come from the origin.

11. Should we add rate limiting in MVP?

    Without auth, a public endpoint that triggers LLM calls should have at least IP-based throttling.

12. Should the Docker setup include only the API service for MVP, or also disabled Compose profiles for future Redis/Postgres?

    I can keep the default simple and add profiles later, or scaffold future services now.
