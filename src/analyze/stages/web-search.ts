export interface WebSearchEnv {
  ENABLE_WEB_SEARCH?: string;
}

const FALSY = new Set(['false', '0', 'off', 'no']);

export function isWebSearchEnabled(env: WebSearchEnv): boolean {
  const value = env.ENABLE_WEB_SEARCH?.trim().toLowerCase();
  if (!value) {
    return true;
  }
  return !FALSY.has(value);
}
