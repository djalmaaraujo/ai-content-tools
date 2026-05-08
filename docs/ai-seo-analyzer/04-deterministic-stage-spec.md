# Deterministic Stage Spec

## Purpose

Collect factual evidence from the target URL before any LLM reasoning happens. This stage should be deterministic, testable, and resilient to missing optional resources.

## Inputs

- `targetUrl`: the user-submitted URL after validation and normalization.
- `origin`: URL origin derived from `targetUrl`.

## Resources To Fetch

- Target HTML page: `targetUrl`.
- `robots.txt`: `${origin}/robots.txt`.
- `sitemap.xml`: `${origin}/sitemap.xml`, plus optional sitemap URLs discovered in robots.txt.
- `llms.txt`: `${origin}/llms.txt`.
- `llms-full.txt`: `${origin}/llms-full.txt`.

## Fetch Policy

- Use `undici`.
- Set a clear user agent, for example `AIContentToolsBot/0.1`.
- Follow normal redirects.
- Use per-request timeout from env, default `10000` ms.
- Cap response size to avoid unbounded memory use.
- Fetch optional resources with `Promise.allSettled`.
- Treat homepage or target page failure as fatal.
- Treat optional file failures as evidence, not fatal errors.

## Security Policy

Before fetching:

- Reject unsupported protocols.
- Accept only domain hostnames.
- Reject IP literals, including IPv4 and bracketed IPv6.
- Reject localhost, single-label hostnames, and numeric hostnames.
- Resolve DNS before fetch and validate resolved addresses.
- Reject private, loopback, link-local, multicast, reserved, and otherwise internal resolved IP ranges.
- Re-check final redirect destinations.

This is required if the API accepts arbitrary user input.

This cannot be determined from `robots.txt`. It is enforced before and during HTTP fetching by validating the parsed URL, requiring a domain hostname, resolving DNS, rejecting private or reserved IP ranges, and checking redirect destinations. Response headers can provide useful evidence, but they are not sufficient for SSRF protection.

## Parser Responsibilities

### HTML Parser

Use `cheerio` to extract:

- Raw HTML size in bytes.
- Visible text with scripts, styles, templates, and noscript removed.
- Title and title length.
- Meta description and length.
- Canonical URL.
- Open Graph completeness.
- Twitter card presence.
- `html[lang]`.
- Viewport meta.
- H1 count.
- Heading hierarchy quality.
- Presence of semantic landmarks such as `article`, `main`, and `nav`.
- Candidate brand name from title and structured data.

### JSON-LD Parser

- Extract all `script[type="application/ld+json"]` blocks.
- Parse defensively.
- Support arrays and `@graph`.
- Return parsed blocks plus parse errors.
- Deduplicate discovered `@type` values.

### robots.txt Parser

Use `robots-parser` to compute access for target AI bots from a versioned registry.

The analysis record must store the bot registry version used for that run. New analyses should use the latest registry version available in the codebase.

Bot groups:

- Search/retrieval bots: `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `MistralAI-Index`, `Googlebot`, `Bingbot`, `Applebot`, `Amzn-SearchBot`.
- User-fetch bots: `ChatGPT-User`, `Claude-User`, `Perplexity-User`, `MistralAI-User`, `Google-Agent`, `Amzn-User`.
- Training/dataset bots: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `Amazonbot`, `CCBot`, `Meta-ExternalAgent`, `Meta-ExternalFetcher`, `Bytespider`, `cohere-ai`, `Diffbot`, `AI2Bot`, `Ai2Bot-Dolma`.
- Legacy compatibility tokens: `anthropic-ai`, `Claude-Web`.

Return:

- Raw robots content.
- HTTP status.
- Sitemap URLs.
- Per-bot access: `allowed`, `blocked`, or `not_mentioned`.
- Registry metadata: category, vendor, purpose, and whether `robots.txt` is a complete or limited signal for that agent.

### Sitemap Parser

Use `fast-xml-parser` to parse XML and return:

- HTTP status.
- Valid XML boolean.
- URL count.
- Sitemap index count when applicable.
- Parse error if invalid.

## Output Contract

```ts
interface DeterministicResult {
  targetUrl: string;
  origin: string;
  homepage: {
    html: string;
    status: number;
    sizeBytes: number;
    visibleText: string;
    headers: Record<string, string>;
    finalUrl: string;
  };
  robotsTxt: {
    content: string | null;
    status: number | null;
    sitemapUrls: string[];
    botAccess: Record<string, 'allowed' | 'blocked' | 'not_mentioned'>;
    botRegistryVersion: string;
  };
  llmsTxt: {
    content: string | null;
    status: number | null;
  };
  llmsFullTxt: {
    content: string | null;
    status: number | null;
  };
  sitemapXml: {
    valid: boolean;
    urlCount: number;
    status: number | null;
    errors: string[];
  };
  extractedJsonLd: unknown[];
  jsonLdErrors: string[];
  extractedMeta: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    htmlLang: string | null;
    viewport: boolean;
    ogComplete: boolean;
    twitterCard: boolean;
    h1Count: number;
    headings: Array<{ level: number; text: string }>;
  };
  brandName: string | null;
}
```

## Test Coverage

- HTML parser handles missing tags and malformed markup.
- JSON-LD parser handles invalid JSON without throwing.
- robots parser handles wildcard fallback and absent robots.txt.
- sitemap parser handles urlset, sitemapindex, and invalid XML.
- deterministic service continues when optional fetches fail.
