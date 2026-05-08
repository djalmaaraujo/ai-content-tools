import * as cheerio from 'cheerio';

export interface ParsedHeading {
  level: number;
  text: string;
}

export interface HtmlParseResult {
  visibleText: string;
  sizeBytes: number;
  meta: {
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    canonical: string | null;
    ogComplete: boolean;
    twitterCard: boolean;
    htmlLang: string | null;
    viewport: boolean;
    xRobotsTag: string | null;
    h1Count: number;
    headings: ParsedHeading[];
  };
  semantic: {
    singleH1: boolean;
    headingHierarchyOk: boolean;
    usesArticle: boolean;
    usesMain: boolean;
    usesNav: boolean;
  };
  renderability: {
    htmlSizeBytes: number;
    visibleTextChars: number;
    ratio: number;
    jsDependent: boolean;
  };
  brandName: string | null;
}

export function parseHtml(
  html: string,
  headers: Record<string, string>,
  _finalUrl: string,
): HtmlParseResult {
  const $ = cheerio.load(html);
  const sizeBytes = Buffer.byteLength(html, 'utf8');

  $('script, style, template, noscript, svg').remove();
  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();
  const visibleTextChars = visibleText.length;
  const ratio = sizeBytes === 0 ? 0 : visibleTextChars / sizeBytes;

  const title = cleanText($('title').first().text());
  const description = cleanText(
    $('meta[name="description" i]').first().attr('content') ?? '',
  );
  const canonical = cleanText($('link[rel~="canonical" i]').first().attr('href') ?? '');
  const htmlLang = cleanText($('html').first().attr('lang') ?? '');
  const headings = extractHeadings($);
  const h1Count = headings.filter((heading) => heading.level === 1).length;

  const meta = {
    title,
    titleLength: title?.length ?? 0,
    description,
    descriptionLength: description?.length ?? 0,
    canonical,
    ogComplete:
      hasMeta($, 'property', 'og:title') &&
      hasMeta($, 'property', 'og:description') &&
      hasMeta($, 'property', 'og:image'),
    twitterCard: hasMeta($, 'name', 'twitter:card'),
    htmlLang,
    viewport: hasMeta($, 'name', 'viewport'),
    xRobotsTag: findHeader(headers, 'x-robots-tag'),
    h1Count,
    headings,
  };

  const semantic = {
    singleH1: h1Count === 1,
    headingHierarchyOk: isHeadingHierarchyOk(headings),
    usesArticle: $('article').length > 0,
    usesMain: $('main').length > 0,
    usesNav: $('nav').length > 0,
  };

  const renderability = {
    htmlSizeBytes: sizeBytes,
    visibleTextChars,
    ratio,
    jsDependent: sizeBytes > 50_000 && visibleTextChars < 1_000,
  };

  return {
    visibleText,
    sizeBytes,
    meta,
    semantic,
    renderability,
    brandName: inferBrandName(title),
  };
}

function extractHeadings($: cheerio.CheerioAPI): ParsedHeading[] {
  const headings: ParsedHeading[] = [];
  $('h1,h2,h3,h4,h5,h6').each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    const level = Number(tagName.slice(1));
    headings.push({ level, text: cleanText($(element).text()) ?? '' });
  });
  return headings;
}

function isHeadingHierarchyOk(headings: ParsedHeading[]): boolean {
  let previousLevel = 0;
  for (const heading of headings) {
    if (previousLevel === 0) {
      if (heading.level > 2) {
        return false;
      }
      previousLevel = heading.level;
      continue;
    }
    if (heading.level > previousLevel + 1) {
      return false;
    }
    previousLevel = heading.level;
  }
  return true;
}

function hasMeta($: cheerio.CheerioAPI, attribute: 'name' | 'property', value: string): boolean {
  return $(`meta[${attribute}="${value}" i]`).length > 0;
}

function cleanText(value: string): string | null {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function findHeader(headers: Record<string, string>, wanted: string): string | null {
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === wanted.toLowerCase(),
  );
  return entry?.[1] ?? null;
}

function inferBrandName(title: string | null): string | null {
  if (!title) {
    return null;
  }
  const [candidate] = title.split(/\s+[|—-]\s+/);
  const cleaned = cleanText(candidate ?? title);
  return cleaned;
}

