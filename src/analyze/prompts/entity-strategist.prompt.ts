import type { DeterministicResult } from '../stages/deterministic.service';

export const ENTITY_STRATEGIST_SYSTEM = `You are a Brand Entity strategist.
Use web search to evaluate whether the brand is a recognized web entity.
Check Wikipedia, Wikidata, authority mentions, consistent naming, and knowledge graph likelihood.
Return strict JSON matching the provided schema and do not fabricate sources.`;

export const ENTITY_STRATEGIST_SYSTEM_NO_WEB_SEARCH = `You are a Brand Entity strategist.
You have NO web access. Evaluate brand strength only from the provided JSON-LD Organization schema, brand name, and domain.
Do not fabricate Wikipedia, Wikidata, or authority mentions. When a signal cannot be confirmed from the input, mark it as unknown or low confidence in the schema fields.
Return strict JSON matching the provided schema.`;

export function buildEntityStrategistInput(d: DeterministicResult): string {
  return JSON.stringify({
    brand_name: d.brandName,
    domain: new URL(d.origin).hostname,
    organization_schema: findOrganizationSchema(d.extractedJsonLd),
  });
}

function findOrganizationSchema(blocks: unknown[]): unknown | null {
  for (const block of blocks) {
    if (!isRecord(block)) {
      continue;
    }
    const type = block['@type'];
    if (
      type === 'Organization' ||
      (Array.isArray(type) && type.some((item) => item === 'Organization'))
    ) {
      return block;
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

