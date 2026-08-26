import { Agent, Dispatcher, ProxyAgent } from 'undici';

export const DEFAULT_USER_AGENT = 'AIContentToolsBot/0.1';

export interface HttpClientEnv {
  HTTP_PROXY_URL?: string;
  HTTPS_PROXY?: string;
  USER_AGENT_POOL?: string;
}

export function buildDispatcher(env: HttpClientEnv): Dispatcher {
  const proxyUrl = env.HTTP_PROXY_URL?.trim() || env.HTTPS_PROXY?.trim();
  if (proxyUrl) {
    return new ProxyAgent({ uri: proxyUrl });
  }
  return new Agent();
}

export function pickUserAgent(env: HttpClientEnv, index: number): string {
  const raw = env.USER_AGENT_POOL;
  if (!raw) {
    return DEFAULT_USER_AGENT;
  }
  const pool = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (pool.length === 0) {
    return DEFAULT_USER_AGENT;
  }
  const safeIndex = ((index % pool.length) + pool.length) % pool.length;
  return pool[safeIndex];
}
