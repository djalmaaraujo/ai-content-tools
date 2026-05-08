import type {
  ContentAudit,
  EntityAudit,
  TechnicalAudit,
} from '../dto/analysis-result.schema';
import type { DeterministicResult } from '../stages/deterministic.service';

export const SYNTHESIZER_SYSTEM = `You are a Senior AI SEO Consultant.
Reconcile the specialist audits, calculate the weighted final score, and produce an English executive report.
Return strict JSON matching the provided schema.
Every recommendation must trace back to specialist findings or deterministic evidence.`;

export function buildSynthesizerInput(input: {
  url: string;
  deterministic: DeterministicResult;
  technical: TechnicalAudit;
  content: ContentAudit;
  entity: EntityAudit;
}): string {
  return JSON.stringify({
    target_url: input.url,
    analyzed_at: new Date().toISOString(),
    report_language: process.env.REPORT_LANGUAGE ?? 'en',
    deterministic_checks: {
      homepage_status: input.deterministic.homepage.status,
      final_url: input.deterministic.homepage.finalUrl,
      robots_txt_present: input.deterministic.robotsTxt.status === 200,
      bot_registry_version: input.deterministic.robotsTxt.botRegistryVersion,
      llms_txt_present: input.deterministic.llmsTxt.status === 200,
      llms_full_present: input.deterministic.llmsFullTxt.status === 200,
      sitemap_valid: input.deterministic.sitemapXml.valid,
      brand_name: input.deterministic.brandName,
      renderability: input.deterministic.renderability,
    },
    scoring_weights: {
      crawler_access: 0.25,
      llms_files: 0.15,
      renderability: 0.15,
      structured_data: 0.15,
      technical_hygiene: 0.1,
      geo_signals: 0.1,
      entity_strength: 0.05,
      eeat: 0.05,
    },
    technical_audit: input.technical,
    content_audit: input.content,
    entity_audit: input.entity,
  });
}

