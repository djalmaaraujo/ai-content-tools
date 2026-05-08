import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { DeterministicResult, DeterministicService } from '../src/analyze/stages/deterministic.service';
import { STRUCTURED_LLM_PROVIDER, StructuredLlmProvider } from '../src/llm/structured-llm.provider';
import { AI_BOT_REGISTRY } from '../src/analyze/bots/ai-bot-registry';

const allowedBotAccess = Object.fromEntries(
  AI_BOT_REGISTRY.map((bot) => [bot.token, 'allowed']),
);

class FakeDeterministicService {
  async run(targetUrl: string): Promise<DeterministicResult> {
    return {
      targetUrl,
      origin: 'https://example.com',
      homepage: {
        html: '<html><head><title>Example</title></head><body><h1>Example</h1><p>Useful content with 42 facts.</p></body></html>',
        status: 200,
        sizeBytes: 116,
        visibleText: 'Example Useful content with 42 facts.',
        headers: {},
        finalUrl: targetUrl,
      },
      robotsTxt: {
        content: 'User-agent: *\nAllow: /',
        status: 200,
        sitemapUrls: ['https://example.com/sitemap.xml'],
        botAccess: {},
        botRegistryVersion: '2026-05-07',
        bots: [],
      },
      llmsTxt: { content: '# Example\nhttps://example.com/blog/post', status: 200 },
      llmsFullTxt: { content: '# Full Example', status: 200 },
      sitemapXml: { valid: true, urlCount: 1, status: 200, errors: [], sitemapIndexCount: 0 },
      extractedJsonLd: [],
      jsonLdErrors: [],
      extractedMeta: {
        title: 'Example',
        description: null,
        canonical: null,
        htmlLang: null,
        viewport: false,
        ogComplete: false,
        twitterCard: false,
        h1Count: 1,
        headings: [{ level: 1, text: 'Example' }],
      },
      semantic: {
        singleH1: true,
        headingHierarchyOk: true,
        usesArticle: false,
        usesMain: false,
        usesNav: false,
      },
      renderability: {
        htmlSizeBytes: 116,
        visibleTextChars: 37,
        ratio: 0.3189,
        jsDependent: false,
      },
      brandName: 'Example',
    };
  }
}

class FakeLlmProvider extends StructuredLlmProvider {
  async runStructuredCall<T>(args: Parameters<StructuredLlmProvider['runStructuredCall']>[0]): Promise<T> {
    const outputs: Record<string, unknown> = {
      TechnicalAudit: {
        bot_access: allowedBotAccess,
        meta_tags: {
          title: 'Example',
          title_length: 7,
          description: null,
          description_length: 0,
          canonical: null,
          og_complete: false,
          twitter_card: false,
          html_lang: null,
          viewport: false,
          x_robots_tag: null,
        },
        semantic_html: {
          single_h1: true,
          heading_hierarchy_ok: true,
          uses_article: false,
          uses_main: false,
          uses_nav: false,
        },
        structured_data: {
          blocks_count: 0,
          valid_count: 0,
          types: [],
          critical_present: {
            Organization: false,
            WebSite: false,
            Article_or_BlogPosting: false,
          },
        },
        renderability: {
          html_size_bytes: 116,
          visible_text_chars: 37,
          ratio: 0.3189,
          js_dependent: false,
        },
        technical_hygiene: {
          https: true,
          hsts: false,
          csp: false,
          sitemap_valid: true,
        },
        sub_scores: {
          crawler_access: 100,
          structured_data: 0,
          renderability: 100,
          technical_hygiene: 35,
        },
        findings: [],
      },
      ContentAudit: {
        stats_density: 'medium',
        stats_examples: ['42 facts'],
        citations_quality: 'low',
        citations_examples: [],
        answer_first: {
          has_summary_block: false,
          question_headings_ratio: 0,
          inverted_pyramid: true,
          evidence: 'Content starts with useful facts.',
        },
        expert_signals: { named_experts_count: 0, examples: [] },
        quotable_sentences: ['Useful content has 42 facts.'],
        freshness: {
          publication_date_visible: false,
          update_date_visible: false,
          recent_references: false,
        },
        eeat_signals: {
          author_visible: false,
          credentials_present: false,
          first_person_experience: false,
        },
        llms_files: {
          llms_txt_quality: 'good',
          llms_full_quality: 'good',
          issues: [],
        },
        sub_scores: { geo_signals: 60, eeat: 0, llms_files: 70 },
        findings: [],
      },
      EntityAudit: {
        brand_name_used: 'Example',
        wikipedia: {
          has_article: false,
          url: null,
          quality: 'none',
          languages: 0,
        },
        wikidata: {
          has_entry: false,
          entry_id: null,
          properties_richness: 'none',
        },
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
      },
      FinalReport: {
        url: 'https://example.com/blog/post',
        analyzed_at: new Date('2026-05-07T12:00:00.000Z').toISOString(),
        executive_summary: 'Example has basic AI SEO readiness but needs stronger entity and content signals.',
        final_score: 64,
        classification: 'needs_improvement',
        category_scores: {
          crawler_access: 100,
          llms_files: 70,
          renderability: 100,
          structured_data: 0,
          technical_hygiene: 35,
          geo_signals: 60,
          entity_strength: 0,
          eeat: 0,
        },
        headline_findings: {
          strengths: ['Crawlers can access the page.'],
          weaknesses: ['Structured data is missing.'],
          uncertainty_notes: [],
        },
        recommendations: {
          quick_wins: [
            {
              action: 'Add Organization and WebSite JSON-LD.',
              impact: 'Improves entity understanding.',
              effort: 'low',
              category: 'structured_data',
              supporting_findings: ['Structured data is missing.'],
            },
          ],
          strategic: [
            {
              action: 'Publish cite-worthy content with clear evidence.',
              impact: 'Improves LLM citation readiness.',
              effort: 'high',
              category: 'content',
              supporting_findings: ['Content needs stronger evidence.'],
            },
          ],
          nice_to_have: [],
        },
      },
    };

    return args.schema.parse(outputs[args.schemaName]) as T;
  }
}

describe('Analyze API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DeterministicService)
      .useClass(FakeDeterministicService)
      .overrideProvider(STRUCTURED_LLM_PROVIDER)
      .useClass(FakeLlmProvider)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns health status', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });

  it('rejects IP targets', async () => {
    await request(app.getHttpServer())
      .post('/analyze')
      .send({ url: 'http://127.0.0.1' })
      .expect(400);
  });

  it('starts an analysis and eventually returns a final report', async () => {
    const statusResponse = await startAndWaitForDone(app);

    expect(statusResponse.body).toMatchObject({
      url: 'https://example.com/blog/post',
      status: 'done',
      progress: 100,
      botRegistryVersion: '2026-05-07',
      result: {
        classification: 'needs_improvement',
        final_score: 64,
      },
    });
  });

  it('renders a Tailwind-backed HTML report for a completed analysis', async () => {
    const statusResponse = await startAndWaitForDone(app);
    const analysisId = statusResponse.body.id;

    const report = await request(app.getHttpServer())
      .get(`/analyze/${analysisId}/report`)
      .expect(200)
      .expect('content-type', /text\/html/);

    expect(report.text).toContain('https://cdn.tailwindcss.com');
    expect(report.text).toContain('AI SEO Report');
    expect(report.text).toContain('https://example.com/blog/post');
    expect(report.text).toContain('64');
    expect(report.text).toContain('needs improvement');
    expect(report.text).toContain('Add Organization and WebSite JSON-LD.');
  });
});

async function startAndWaitForDone(app: INestApplication): Promise<request.Response> {
  const start = await request(app.getHttpServer())
    .post('/analyze')
    .send({ url: 'example.com/blog/post' })
    .expect(202);

  expect(start.body.analysisId).toEqual(expect.any(String));

  let statusResponse = await request(app.getHttpServer())
    .get(`/analyze/${start.body.analysisId}`)
    .expect(200);

  for (let attempt = 0; attempt < 20 && statusResponse.body.status !== 'done'; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    statusResponse = await request(app.getHttpServer())
      .get(`/analyze/${start.body.analysisId}`)
      .expect(200);
  }

  return statusResponse;
}
