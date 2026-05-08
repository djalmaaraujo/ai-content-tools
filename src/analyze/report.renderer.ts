import { AnalysisRecord } from './analysis.store';
import { FinalReport, FinalReportSchema } from './dto/analysis-result.schema';

export function renderAnalysisReport(record: AnalysisRecord): string {
  const report = FinalReportSchema.parse(record.result);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI SEO Report - ${escapeHtml(report.url)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased">
    <main class="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
      <header class="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-sm font-medium uppercase tracking-wide text-cyan-300">AI SEO Report</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-5xl">${escapeHtml(report.url)}</h1>
          <p class="mt-4 text-base leading-7 text-slate-300">${escapeHtml(report.executive_summary)}</p>
        </div>
        <div class="grid min-w-56 grid-cols-2 gap-3 rounded border border-slate-800 bg-slate-900 p-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Score</p>
            <p class="mt-1 text-4xl font-semibold text-white">${formatScore(report.final_score)}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <p class="mt-2 rounded bg-cyan-400 px-2 py-1 text-center text-sm font-semibold text-slate-950">${escapeHtml(formatClassification(report.classification))}</p>
          </div>
        </div>
      </header>

      <section>
        <h2 class="text-lg font-semibold text-white">Category Scores</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          ${renderCategoryScores(report)}
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-3">
        ${renderFindingPanel('Strengths', report.headline_findings.strengths)}
        ${renderFindingPanel('Weaknesses', report.headline_findings.weaknesses)}
        ${renderFindingPanel('Uncertainty Notes', report.headline_findings.uncertainty_notes)}
      </section>

      <section class="grid gap-5 lg:grid-cols-3">
        ${renderRecommendations('Quick Wins', report.recommendations.quick_wins)}
        ${renderRecommendations('Strategic', report.recommendations.strategic)}
        ${renderRecommendations('Nice To Have', report.recommendations.nice_to_have)}
      </section>

      <footer class="border-t border-slate-800 pt-6 text-sm text-slate-500">
        <p>Analysis ID: ${escapeHtml(record.id)} · Bot registry: ${escapeHtml(record.botRegistryVersion)} · Analyzed at: ${escapeHtml(report.analyzed_at)}</p>
      </footer>
    </main>
  </body>
</html>`;
}

function renderCategoryScores(report: FinalReport): string {
  return Object.entries(report.category_scores)
    .map(([category, score]) => {
      const normalized = clamp(Number(score), 0, 100);
      return `<article class="rounded border border-slate-800 bg-slate-900 p-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-medium text-slate-200">${escapeHtml(formatLabel(category))}</h3>
          <span class="text-sm font-semibold text-cyan-300">${formatScore(score)}</span>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded bg-slate-800">
          <div class="h-full rounded bg-cyan-400" style="width: ${normalized}%"></div>
        </div>
      </article>`;
    })
    .join('');
}

function renderFindingPanel(title: string, items: string[]): string {
  return `<article class="rounded border border-slate-800 bg-slate-900 p-5">
    <h2 class="text-lg font-semibold text-white">${escapeHtml(title)}</h2>
    ${renderList(items)}
  </article>`;
}

function renderRecommendations(
  title: string,
  items: FinalReport['recommendations']['quick_wins'],
): string {
  const body =
    items.length === 0
      ? '<p class="mt-4 text-sm text-slate-400">No recommendations in this group.</p>'
      : items
          .map(
            (item) => `<article class="mt-4 border-t border-slate-800 pt-4">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-sm font-semibold leading-6 text-white">${escapeHtml(item.action)}</h3>
                <span class="shrink-0 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">${escapeHtml(item.effort)}</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-300">${escapeHtml(item.impact)}</p>
              <p class="mt-2 text-xs uppercase tracking-wide text-cyan-300">${escapeHtml(formatLabel(item.category))}</p>
            </article>`,
          )
          .join('');

  return `<section class="rounded border border-slate-800 bg-slate-900 p-5">
    <h2 class="text-lg font-semibold text-white">${escapeHtml(title)}</h2>
    ${body}
  </section>`;
}

function renderList(items: string[]): string {
  if (items.length === 0) {
    return '<p class="mt-4 text-sm text-slate-400">None reported.</p>';
  }

  return `<ul class="mt-4 space-y-3 text-sm leading-6 text-slate-300">
    ${items.map((item) => `<li class="border-l-2 border-cyan-400 pl-3">${escapeHtml(item)}</li>`).join('')}
  </ul>`;
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatClassification(value: string): string {
  return value.replace(/_/g, ' ');
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

