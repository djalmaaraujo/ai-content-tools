import { Injectable } from '@nestjs/common';
import { fetch, type Dispatcher, type Response as UndiciResponse } from 'undici';
import { AI_BOT_REGISTRY } from '../bots/ai-bot-registry';
import { HtmlParseResult, parseHtml } from '../parsers/html.parser';
import { extractJsonLd } from '../parsers/jsonld.parser';
import { BotAccess, ParsedBotAccess, parseRobotsTxt } from '../parsers/robots-txt.parser';
import { parseSitemap } from '../parsers/sitemap.parser';
import {
  assertPublicDnsResolution,
  normalizeAnalyzeUrl,
} from '../../common/url-safety';
import { buildDispatcher, pickUserAgent } from '../../common/http-client';

export interface DeterministicResult {
  targetUrl: string;
  origin: string;
  homepage: {
    html: string;
    status: number;
    sizeBytes: number;
    visibleText: string;
    headers: Record<string, string>;
    finalUrl: string;
  };
  robotsTxt: {
    content: string | null;
    status: number | null;
    sitemapUrls: string[];
    botAccess: Record<string, BotAccess>;
    botRegistryVersion: string;
    bots: ParsedBotAccess[];
  };
  llmsTxt: {
    content: string | null;
    status: number | null;
  };
  llmsFullTxt: {
    content: string | null;
    status: number | null;
  };
  sitemapXml: {
    valid: boolean;
    urlCount: number;
    sitemapIndexCount: number;
    status: number | null;
    errors: string[];
  };
  extractedJsonLd: unknown[];
  jsonLdErrors: string[];
  extractedMeta: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    htmlLang: string | null;
    viewport: boolean;
    ogComplete: boolean;
    twitterCard: boolean;
    h1Count: number;
    headings: Array<{ level: number; text: string }>;
  };
  semantic: HtmlParseResult['semantic'];
  renderability: HtmlParseResult['renderability'];
  brandName: string | null;
}

interface FetchedText {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
}

@Injectable()
export class DeterministicService {
  private readonly timeoutMs = Number(process.env.HTTP_TIMEOUT_MS ?? 10_000);
  private readonly maxBytes = Number(process.env.HTTP_MAX_BYTES ?? 2_000_000);
  private readonly dispatcher: Dispatcher = buildDispatcher(process.env);
  private requestCounter = 0;

  async run(targetUrl: string): Promise<DeterministicResult> {
    const normalized = normalizeAnalyzeUrl(targetUrl);
    const homepage = await this.safeFetchText(normalized.targetUrl);
    if (homepage.status < 200 || homepage.status >= 400) {
      throw new Error(`Target page returned HTTP ${homepage.status}`);
    }

    const origin = normalized.origin;
    const [robotsFetch, llmsTxtFetch, llmsFullTxtFetch, sitemapFetch] =
      await Promise.allSettled([
        this.safeFetchText(`${origin}/robots.txt`),
        this.safeFetchText(`${origin}/llms.txt`),
        this.safeFetchText(`${origin}/llms-full.txt`),
        this.safeFetchText(`${origin}/sitemap.xml`),
      ]);

    const headers = homepage.headers;
    const html = parseHtml(homepage.body, headers, homepage.url);
    const jsonLd = extractJsonLd(homepage.body);
    const robots = valueOrNull(robotsFetch);
    const llmsTxt = valueOrNull(llmsTxtFetch);
    const llmsFullTxt = valueOrNull(llmsFullTxtFetch);
    const sitemap = valueOrNull(sitemapFetch);
    const parsedRobots = parseRobotsTxt({
      content: robots?.body ?? null,
      robotsUrl: `${origin}/robots.txt`,
      targetUrl: normalized.targetUrl,
      registry: AI_BOT_REGISTRY,
    });
    const parsedSitemap = parseSitemap(sitemap?.body ?? null);

    return {
      targetUrl: normalized.targetUrl,
      origin,
      homepage: {
        html: homepage.body,
        status: homepage.status,
        sizeBytes: html.sizeBytes,
        visibleText: html.visibleText,
        headers,
        finalUrl: homepage.url,
      },
      robotsTxt: {
        content: robots?.body ?? null,
        status: robots?.status ?? null,
        sitemapUrls: parsedRobots.sitemapUrls,
        botAccess: parsedRobots.botAccess,
        botRegistryVersion: parsedRobots.botRegistryVersion,
        bots: parsedRobots.bots,
      },
      llmsTxt: { content: llmsTxt?.body ?? null, status: llmsTxt?.status ?? null },
      llmsFullTxt: {
        content: llmsFullTxt?.body ?? null,
        status: llmsFullTxt?.status ?? null,
      },
      sitemapXml: {
        ...parsedSitemap,
        status: sitemap?.status ?? null,
      },
      extractedJsonLd: jsonLd.blocks,
      jsonLdErrors: jsonLd.errors,
      extractedMeta: {
        title: html.meta.title,
        description: html.meta.description,
        canonical: html.meta.canonical,
        htmlLang: html.meta.htmlLang,
        viewport: html.meta.viewport,
        ogComplete: html.meta.ogComplete,
        twitterCard: html.meta.twitterCard,
        h1Count: html.meta.h1Count,
        headings: html.meta.headings,
      },
      semantic: html.semantic,
      renderability: html.renderability,
      brandName: inferBrandFromJsonLd(jsonLd.blocks) ?? html.brandName,
    };
  }

  private async safeFetchText(initialUrl: string): Promise<FetchedText> {
    let current = normalizeAnalyzeUrl(initialUrl);

    for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
      await assertPublicDnsResolution(current.hostname);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const userAgent = pickUserAgent(process.env, this.requestCounter);
        this.requestCounter += 1;
        const response = await fetch(current.targetUrl, {
          redirect: 'manual',
          signal: controller.signal,
          dispatcher: this.dispatcher,
          headers: { 'user-agent': userAgent, accept: 'text/html, text/plain, */*' },
        });
        const headers = headersToRecord(response.headers);
        if (isRedirect(response.status)) {
          const location = response.headers.get('location');
          if (!location) {
            throw new Error(`Redirect without location from ${current.targetUrl}`);
          }
          const redirectUrl = new URL(location, current.targetUrl).toString();
          current = normalizeAnalyzeUrl(redirectUrl);
          continue;
        }

        return {
          url: current.targetUrl,
          status: response.status,
          headers,
          body: await readLimitedText(response, this.maxBytes),
        };
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error(`Too many redirects for ${initialUrl}`);
  }
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

async function readLimitedText(response: UndiciResponse, maxBytes: number): Promise<string> {
  const body = response.body;
  if (!body) {
    return '';
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error(`Response exceeded max size of ${maxBytes} bytes`);
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function valueOrNull<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

function inferBrandFromJsonLd(blocks: unknown[]): string | null {
  for (const block of blocks) {
    if (!isRecord(block)) {
      continue;
    }
    const type = block['@type'];
    const isOrganization =
      type === 'Organization' ||
      (Array.isArray(type) && type.some((item) => item === 'Organization'));
    if (isOrganization && typeof block.name === 'string' && block.name.trim()) {
      return block.name.trim();
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
