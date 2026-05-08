import { XMLParser, XMLValidator } from 'fast-xml-parser';

export interface SitemapParseResult {
  valid: boolean;
  urlCount: number;
  sitemapIndexCount: number;
  errors: string[];
}

export function parseSitemap(xml: string | null): SitemapParseResult {
  if (!xml) {
    return { valid: false, urlCount: 0, sitemapIndexCount: 0, errors: ['Sitemap missing'] };
  }

  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    return {
      valid: false,
      urlCount: 0,
      sitemapIndexCount: 0,
      errors: [validation.err.msg],
    };
  }

  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml) as Record<string, unknown>;
    const urlset = asRecord(parsed.urlset);
    const sitemapindex = asRecord(parsed.sitemapindex);

    return {
      valid: true,
      urlCount: countArrayish(urlset?.url),
      sitemapIndexCount: countArrayish(sitemapindex?.sitemap),
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sitemap parse error';
    return { valid: false, urlCount: 0, sitemapIndexCount: 0, errors: [message] };
  }
}

function countArrayish(value: unknown): number {
  if (!value) {
    return 0;
  }
  return Array.isArray(value) ? value.length : 1;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

