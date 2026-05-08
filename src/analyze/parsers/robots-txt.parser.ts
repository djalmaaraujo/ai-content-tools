import robotsParser = require('robots-parser');
import { AiBotDefinition, BOT_REGISTRY_VERSION } from '../bots/ai-bot-registry';

export type BotAccess = 'allowed' | 'blocked' | 'not_mentioned';

export interface ParsedBotAccess {
  token: string;
  access: BotAccess;
  vendor: string;
  category: AiBotDefinition['category'];
  purpose: string;
  robotsTxtSignal: AiBotDefinition['robotsTxtSignal'];
}

export interface RobotsTxtParseInput {
  content: string | null;
  robotsUrl: string;
  targetUrl: string;
  registry: readonly AiBotDefinition[];
}

export interface RobotsTxtParseResult {
  sitemapUrls: string[];
  botAccess: Record<string, BotAccess>;
  bots: ParsedBotAccess[];
  botRegistryVersion: string;
}

interface RobotsGroup {
  agents: string[];
  hasRules: boolean;
}

export function parseRobotsTxt(input: RobotsTxtParseInput): RobotsTxtParseResult {
  if (!input.content) {
    const botAccess: Record<string, BotAccess> = {};
    for (const bot of input.registry) {
      botAccess[bot.token] = 'not_mentioned';
    }
    return {
      sitemapUrls: [],
      botAccess,
      bots: input.registry.map((bot) => toParsedBot(bot, 'not_mentioned')),
      botRegistryVersion: BOT_REGISTRY_VERSION,
    };
  }

  const parsed = robotsParser(input.robotsUrl, input.content);
  const groups = parseGroups(input.content);
  const sitemapUrls = extractSitemapUrls(input.content);
  const botAccess: Record<string, BotAccess> = {};
  const bots: ParsedBotAccess[] = [];

  for (const bot of input.registry) {
    const mentioned = isBotMentioned(bot.token, groups);
    let access: BotAccess = 'not_mentioned';
    if (mentioned) {
      access = parsed.isAllowed(input.targetUrl, bot.token) === false ? 'blocked' : 'allowed';
    }
    botAccess[bot.token] = access;
    bots.push(toParsedBot(bot, access));
  }

  return {
    sitemapUrls,
    botAccess,
    bots,
    botRegistryVersion: BOT_REGISTRY_VERSION,
  };
}

function toParsedBot(bot: AiBotDefinition, access: BotAccess): ParsedBotAccess {
  return {
    token: bot.token,
    access,
    vendor: bot.vendor,
    category: bot.category,
    purpose: bot.purpose,
    robotsTxtSignal: bot.robotsTxtSignal,
  };
}

function extractSitemapUrls(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap\s*:/i.test(line))
    .map((line) => line.replace(/^sitemap\s*:/i, '').trim())
    .filter(Boolean);
}

function parseGroups(content: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let currentAgents: string[] = [];
  let hasRules = false;

  const flush = () => {
    if (currentAgents.length > 0) {
      groups.push({ agents: currentAgents, hasRules });
    }
    currentAgents = [];
    hasRules = false;
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) {
      flush();
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim().toLowerCase();

    if (key === 'user-agent') {
      if (hasRules) {
        flush();
      }
      currentAgents.push(value);
      continue;
    }

    if (currentAgents.length > 0 && (key === 'allow' || key === 'disallow')) {
      hasRules = true;
    }
  }

  flush();
  return groups;
}

function isBotMentioned(token: string, groups: RobotsGroup[]): boolean {
  const lowerToken = token.toLowerCase();
  return groups.some(
    (group) =>
      group.hasRules &&
      group.agents.some((agent) => agent === '*' || agent === lowerToken),
  );
}
