import type { DeterministicResult } from '../stages/deterministic.service';

export const TECHNICAL_AUDITOR_SYSTEM = `You are a Technical SEO auditor specialized in AI crawler accessibility.
Evaluate only technical implementation. Return strict JSON matching the provided schema.
Use deterministic evidence from the input; do not invent facts.
Focus on bot access, metadata, semantic HTML, structured data, renderability, and technical hygiene.`;

export function buildTechnicalAuditorInput(d: DeterministicResult): string {
  return JSON.stringify({
    target_url: d.targetUrl,
    response_headers: d.homepage.headers,
    robots_txt: d.robotsTxt.content,
    parsed_bot_access: d.robotsTxt.bots,
    bot_registry_version: d.robotsTxt.botRegistryVersion,
    sitemap_status: {
      found: d.sitemapXml.status === 200,
      valid_xml: d.sitemapXml.valid,
      url_count: d.sitemapXml.urlCount,
      errors: d.sitemapXml.errors,
    },
    extracted_meta: d.extractedMeta,
    semantic: d.semantic,
    renderability: d.renderability,
    extracted_jsonld: d.extractedJsonLd,
    jsonld_errors: d.jsonLdErrors,
    homepage_html_excerpt: d.homepage.html.slice(0, 12_000),
  });
}

