import { z } from 'zod';
import { AI_BOT_REGISTRY } from '../bots/ai-bot-registry';

const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
const BotAccessValueSchema = z.enum(['allowed', 'blocked', 'not_mentioned']);
const BotAccessShape = Object.fromEntries(
  AI_BOT_REGISTRY.map((bot) => [bot.token, BotAccessValueSchema]),
) as Record<string, typeof BotAccessValueSchema>;

const CategoryScoresSchema = z.object({
  crawler_access: z.number(),
  llms_files: z.number(),
  renderability: z.number(),
  structured_data: z.number(),
  technical_hygiene: z.number(),
  geo_signals: z.number(),
  entity_strength: z.number(),
  eeat: z.number(),
});

export const TechnicalAuditSchema = z.object({
  bot_access: z.object(BotAccessShape),
  meta_tags: z.object({
    title: z.string().nullable(),
    title_length: z.number(),
    description: z.string().nullable(),
    description_length: z.number(),
    canonical: z.string().nullable(),
    og_complete: z.boolean(),
    twitter_card: z.boolean(),
    html_lang: z.string().nullable(),
    viewport: z.boolean(),
    x_robots_tag: z.string().nullable(),
  }),
  semantic_html: z.object({
    single_h1: z.boolean(),
    heading_hierarchy_ok: z.boolean(),
    uses_article: z.boolean(),
    uses_main: z.boolean(),
    uses_nav: z.boolean(),
  }),
  structured_data: z.object({
    blocks_count: z.number(),
    valid_count: z.number(),
    types: z.array(z.string()),
    critical_present: z.object({
      Organization: z.boolean(),
      WebSite: z.boolean(),
      Article_or_BlogPosting: z.boolean(),
    }),
  }),
  renderability: z.object({
    html_size_bytes: z.number(),
    visible_text_chars: z.number(),
    ratio: z.number(),
    js_dependent: z.boolean(),
  }),
  technical_hygiene: z.object({
    https: z.boolean(),
    hsts: z.boolean(),
    csp: z.boolean(),
    sitemap_valid: z.boolean(),
  }),
  sub_scores: z.object({
    crawler_access: z.number(),
    structured_data: z.number(),
    renderability: z.number(),
    technical_hygiene: z.number(),
  }),
  findings: z.array(
    z.object({
      severity: SeveritySchema,
      category: z.string(),
      issue: z.string(),
      evidence: z.string(),
    }),
  ),
});

export const ContentAuditSchema = z.object({
  stats_density: z.enum(['low', 'medium', 'high']),
  stats_examples: z.array(z.string()),
  citations_quality: z.enum(['low', 'medium', 'high']),
  citations_examples: z.array(z.string()),
  answer_first: z.object({
    has_summary_block: z.boolean(),
    question_headings_ratio: z.number(),
    inverted_pyramid: z.boolean(),
    evidence: z.string(),
  }),
  expert_signals: z.object({
    named_experts_count: z.number(),
    examples: z.array(z.string()),
  }),
  quotable_sentences: z.array(z.string()),
  freshness: z.object({
    publication_date_visible: z.boolean(),
    update_date_visible: z.boolean(),
    recent_references: z.boolean(),
  }),
  eeat_signals: z.object({
    author_visible: z.boolean(),
    credentials_present: z.boolean(),
    first_person_experience: z.boolean(),
  }),
  llms_files: z.object({
    llms_txt_quality: z.enum(['missing', 'poor', 'good', 'excellent']),
    llms_full_quality: z.enum(['missing', 'poor', 'good', 'excellent']),
    issues: z.array(z.string()),
  }),
  sub_scores: z.object({
    geo_signals: z.number(),
    eeat: z.number(),
    llms_files: z.number(),
  }),
  findings: z.array(
    z.object({
      severity: SeveritySchema,
      category: z.string(),
      issue: z.string(),
      suggestion: z.string(),
    }),
  ),
});

export const EntityAuditSchema = z.object({
  brand_name_used: z.string(),
  wikipedia: z.object({
    has_article: z.boolean(),
    url: z.string().nullable(),
    quality: z.enum(['stub', 'short', 'medium', 'comprehensive', 'none']),
    languages: z.number(),
  }),
  wikidata: z.object({
    has_entry: z.boolean(),
    entry_id: z.string().nullable(),
    properties_richness: z.enum(['low', 'medium', 'high', 'none']),
  }),
  knowledge_panel_likely: z.enum(['yes', 'maybe', 'no']),
  authority_mentions: z.object({
    tier_1_news: z.array(z.object({ source: z.string(), url: z.string() })),
    industry_pubs: z.array(z.object({ source: z.string(), url: z.string() })),
    academic_mentions: z.array(z.object({ source: z.string(), url: z.string() })),
    total_count: z.number(),
  }),
  nap_consistency: z.enum(['consistent', 'partial', 'inconsistent', 'unknown']),
  sub_scores: z.object({
    entity_strength: z.number(),
  }),
  findings: z.array(
    z.object({
      severity: SeveritySchema,
      issue: z.string(),
      evidence: z.string(),
    }),
  ),
});

const RecommendationSchema = z.object({
  action: z.string(),
  impact: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
  category: z.string(),
  supporting_findings: z.array(z.string()),
});

export const FinalReportSchema = z.object({
  url: z.string(),
  analyzed_at: z.string(),
  executive_summary: z.string(),
  final_score: z.number(),
  classification: z.enum(['critical', 'needs_improvement', 'good', 'excellent']),
  category_scores: CategoryScoresSchema,
  headline_findings: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    uncertainty_notes: z.array(z.string()),
  }),
  recommendations: z.object({
    quick_wins: z.array(RecommendationSchema),
    strategic: z.array(RecommendationSchema),
    nice_to_have: z.array(RecommendationSchema),
  }),
});

export type TechnicalAudit = z.infer<typeof TechnicalAuditSchema>;
export type ContentAudit = z.infer<typeof ContentAuditSchema>;
export type EntityAudit = z.infer<typeof EntityAuditSchema>;
export type FinalReport = z.infer<typeof FinalReportSchema>;
