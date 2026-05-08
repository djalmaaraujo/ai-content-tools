import type { DeterministicResult } from '../stages/deterministic.service';

export const CONTENT_GEO_SYSTEM = `You are a Generative Engine Optimization specialist.
Evaluate whether the page content is structured to be cited by LLMs.
Ignore technical implementation except when the input provides llms.txt signals.
Return strict JSON matching the provided schema.`;

export function buildContentGeoInput(d: DeterministicResult): string {
  return JSON.stringify({
    target_url: d.targetUrl,
    visible_text: d.homepage.visibleText.slice(0, 12_000),
    headings: d.extractedMeta.headings,
    llms_txt: d.llmsTxt.content,
    llms_full_txt: d.llmsFullTxt.content?.slice(0, 8_000) ?? null,
    metadata: d.extractedMeta,
  });
}

