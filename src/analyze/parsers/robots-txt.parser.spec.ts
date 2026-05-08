import { AI_BOT_REGISTRY } from '../bots/ai-bot-registry';
import { parseRobotsTxt } from './robots-txt.parser';

describe('parseRobotsTxt', () => {
  it('computes explicit, wildcard, and not-mentioned access', () => {
    const result = parseRobotsTxt({
      content: `
        User-agent: GPTBot
        Disallow: /

        User-agent: ClaudeBot
        Allow: /

        User-agent: *
        Disallow: /admin/
      `,
      robotsUrl: 'https://example.com/robots.txt',
      targetUrl: 'https://example.com/blog/post',
      registry: AI_BOT_REGISTRY,
    });

    expect(result.botAccess.GPTBot).toBe('blocked');
    expect(result.botAccess.ClaudeBot).toBe('allowed');
    expect(result.botAccess['OAI-SearchBot']).toBe('allowed');
  });

  it('marks bots as not mentioned when no relevant group exists', () => {
    const result = parseRobotsTxt({
      content: 'User-agent: SomeOtherBot\nDisallow: /',
      robotsUrl: 'https://example.com/robots.txt',
      targetUrl: 'https://example.com/',
      registry: AI_BOT_REGISTRY,
    });

    expect(result.botAccess.GPTBot).toBe('not_mentioned');
  });

  it('extracts sitemap URLs', () => {
    const result = parseRobotsTxt({
      content: 'Sitemap: https://example.com/sitemap.xml',
      robotsUrl: 'https://example.com/robots.txt',
      targetUrl: 'https://example.com/',
      registry: AI_BOT_REGISTRY,
    });

    expect(result.sitemapUrls).toEqual(['https://example.com/sitemap.xml']);
  });
});

