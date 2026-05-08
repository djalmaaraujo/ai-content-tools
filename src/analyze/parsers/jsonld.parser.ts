import * as cheerio from 'cheerio';

export interface JsonLdExtraction {
  blocks: unknown[];
  errors: string[];
  types: string[];
}

export function extractJsonLd(html: string): JsonLdExtraction {
  const $ = cheerio.load(html);
  const blocks: unknown[] = [];
  const errors: string[] = [];
  const types = new Set<string>();

  $('script[type="application/ld+json"]').each((index, element) => {
    const raw = $(element).text().trim();
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const flattened = flattenJsonLd(parsed);
      blocks.push(...flattened);
      for (const block of flattened) {
        collectTypes(block, types);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown JSON-LD parse error';
      errors.push(`JSON-LD block ${index + 1}: ${message}`);
    }
  });

  return { blocks, errors, types: [...types] };
}

function flattenJsonLd(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenJsonLd(item));
  }

  if (isRecord(value) && Array.isArray(value['@graph'])) {
    return value['@graph'].flatMap((item) => flattenJsonLd(item));
  }

  return [value];
}

function collectTypes(value: unknown, types: Set<string>): void {
  if (!isRecord(value)) {
    return;
  }

  const typeValue = value['@type'];
  if (typeof typeValue === 'string') {
    types.add(typeValue);
  } else if (Array.isArray(typeValue)) {
    for (const item of typeValue) {
      if (typeof item === 'string') {
        types.add(item);
      }
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

