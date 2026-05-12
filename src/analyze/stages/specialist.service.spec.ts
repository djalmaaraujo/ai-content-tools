import { StructuredLlmCall, StructuredLlmProvider } from '../../llm/structured-llm.provider';
import { SpecialistService } from './specialist.service';
import type { DeterministicResult } from './deterministic.service';

class CapturingLlmProvider implements StructuredLlmProvider {
  public lastCall: StructuredLlmCall<unknown> | null = null;

  async runStructuredCall<T>(args: StructuredLlmCall<T>): Promise<T> {
    this.lastCall = args;
    return entityFixture() as unknown as T;
  }
}

describe('SpecialistService.runEntity web_search toggle', () => {
  const originalEnv = process.env.ENABLE_WEB_SEARCH;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ENABLE_WEB_SEARCH;
    } else {
      process.env.ENABLE_WEB_SEARCH = originalEnv;
    }
  });

  it('passes the web_search tool and default system prompt by default', async () => {
    delete process.env.ENABLE_WEB_SEARCH;
    const llm = new CapturingLlmProvider();
    const service = new SpecialistService(llm);
    await service.runEntity(deterministicFixture());
    expect(llm.lastCall?.tools).toEqual(['web_search']);
    expect(llm.lastCall?.system).toContain('Use web search');
  });

  it('omits tools and switches to the no-web-search prompt when disabled', async () => {
    process.env.ENABLE_WEB_SEARCH = 'false';
    const llm = new CapturingLlmProvider();
    const service = new SpecialistService(llm);
    await service.runEntity(deterministicFixture());
    expect(llm.lastCall?.tools).toEqual([]);
    expect(llm.lastCall?.system).toContain('NO web access');
  });
});

function deterministicFixture(): DeterministicResult {
  return {
    targetUrl: 'https://example.com/',
    origin: 'https://example.com',
    homepage: {
      html: '',
      status: 200,
      sizeBytes: 0,
      visibleText: '',
      headers: {},
      finalUrl: 'https://example.com/',
    },
    robotsTxt: {
      content: null,
      status: null,
      sitemapUrls: [],
      botAccess: {},
      botRegistryVersion: 'test',
      bots: [],
    },
    llmsTxt: { content: null, status: null },
    llmsFullTxt: { content: null, status: null },
    sitemapXml: { valid: false, urlCount: 0, sitemapIndexCount: 0, status: null, errors: [] },
    extractedJsonLd: [],
    jsonLdErrors: [],
    extractedMeta: {
      title: null,
      description: null,
      canonical: null,
      htmlLang: null,
      viewport: false,
      ogComplete: false,
      twitterCard: false,
      h1Count: 0,
      headings: [],
    },
    semantic: {
      singleH1: false,
      headingHierarchyOk: false,
      usesArticle: false,
      usesMain: false,
      usesNav: false,
    },
    renderability: {
      htmlSizeBytes: 0,
      visibleTextChars: 0,
      ratio: 0,
      jsDependent: false,
    },
    brandName: 'Example',
  };
}

function entityFixture(): unknown {
  return {
    brand_name: 'Example',
    wikipedia: { has_article: false, url: null, quality: 'none', languages: 0 },
    wikidata: { has_entry: false, entry_id: null, properties_richness: 'none' },
    knowledge_panel_likely: 'no',
    authority_mentions: {
      tier_1_news: [],
      industry_pubs: [],
      academic_mentions: [],
      total_count: 0,
    },
    nap_consistency: 'unknown',
    sub_scores: { entity_strength: 0 },
    findings: [],
  };
}
