import { Agent, ProxyAgent } from 'undici';
import { buildDispatcher, pickUserAgent } from './http-client';

describe('buildDispatcher', () => {
  it('returns a plain Agent when no proxy env is set', () => {
    const dispatcher = buildDispatcher({});
    expect(dispatcher).toBeInstanceOf(Agent);
    expect(dispatcher).not.toBeInstanceOf(ProxyAgent);
  });

  it('returns a ProxyAgent when HTTP_PROXY_URL is set', () => {
    const dispatcher = buildDispatcher({ HTTP_PROXY_URL: 'http://proxy.example.com:8080' });
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });

  it('returns a ProxyAgent when HTTPS_PROXY is set', () => {
    const dispatcher = buildDispatcher({ HTTPS_PROXY: 'http://proxy.example.com:8080' });
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });

  it('prefers HTTP_PROXY_URL over HTTPS_PROXY when both are set', () => {
    const dispatcher = buildDispatcher({
      HTTP_PROXY_URL: 'http://primary.example.com:1234',
      HTTPS_PROXY: 'http://fallback.example.com:5678',
    });
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });
});

describe('pickUserAgent', () => {
  it('returns the default bot UA when no pool is configured', () => {
    expect(pickUserAgent({}, 0)).toBe('AIContentToolsBot/0.1');
  });

  it('returns a pool entry rotated by index', () => {
    const env = { USER_AGENT_POOL: 'Mozilla/Chrome,Mozilla/Firefox,Mozilla/Safari' };
    expect(pickUserAgent(env, 0)).toBe('Mozilla/Chrome');
    expect(pickUserAgent(env, 1)).toBe('Mozilla/Firefox');
    expect(pickUserAgent(env, 2)).toBe('Mozilla/Safari');
    expect(pickUserAgent(env, 3)).toBe('Mozilla/Chrome');
  });

  it('trims whitespace and ignores empty entries', () => {
    const env = { USER_AGENT_POOL: ' Mozilla/Chrome , , Mozilla/Firefox  ' };
    expect(pickUserAgent(env, 0)).toBe('Mozilla/Chrome');
    expect(pickUserAgent(env, 1)).toBe('Mozilla/Firefox');
  });

  it('falls back to the default when the pool string is empty after trim', () => {
    expect(pickUserAgent({ USER_AGENT_POOL: '  , , ' }, 0)).toBe('AIContentToolsBot/0.1');
  });
});
