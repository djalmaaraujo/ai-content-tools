export const BOT_REGISTRY_VERSION = '2026-05-07';

export type BotCategory = 'search_retrieval' | 'user_fetch' | 'training_dataset' | 'legacy';
export type RobotsTxtSignal = 'complete' | 'limited' | 'policy_token';

export interface AiBotDefinition {
  token: string;
  vendor: string;
  category: BotCategory;
  purpose: string;
  robotsTxtSignal: RobotsTxtSignal;
}

export const AI_BOT_REGISTRY: readonly AiBotDefinition[] = [
  {
    token: 'OAI-SearchBot',
    vendor: 'OpenAI',
    category: 'search_retrieval',
    purpose: 'Search indexing for ChatGPT search surfaces.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'ChatGPT-User',
    vendor: 'OpenAI',
    category: 'user_fetch',
    purpose: 'User-triggered fetches from ChatGPT.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'GPTBot',
    vendor: 'OpenAI',
    category: 'training_dataset',
    purpose: 'OpenAI training and model improvement crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Claude-SearchBot',
    vendor: 'Anthropic',
    category: 'search_retrieval',
    purpose: 'Search indexing for Claude web-connected answers.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Claude-User',
    vendor: 'Anthropic',
    category: 'user_fetch',
    purpose: 'User-triggered fetches from Claude.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'ClaudeBot',
    vendor: 'Anthropic',
    category: 'training_dataset',
    purpose: 'Anthropic training crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'PerplexityBot',
    vendor: 'Perplexity',
    category: 'search_retrieval',
    purpose: 'Perplexity search indexing crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Perplexity-User',
    vendor: 'Perplexity',
    category: 'user_fetch',
    purpose: 'User-triggered Perplexity fetches.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'MistralAI-Index',
    vendor: 'Mistral AI',
    category: 'search_retrieval',
    purpose: 'Le Chat indexing crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'MistralAI-User',
    vendor: 'Mistral AI',
    category: 'user_fetch',
    purpose: 'User-triggered Le Chat fetches.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'Googlebot',
    vendor: 'Google',
    category: 'search_retrieval',
    purpose: 'Google Search crawler used by search and AI Overview surfaces.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Google-Extended',
    vendor: 'Google',
    category: 'training_dataset',
    purpose: 'Robots token controlling some Gemini and Vertex AI uses.',
    robotsTxtSignal: 'policy_token',
  },
  {
    token: 'Google-Agent',
    vendor: 'Google',
    category: 'user_fetch',
    purpose: 'Google user-triggered fetcher.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'Bingbot',
    vendor: 'Microsoft',
    category: 'search_retrieval',
    purpose: 'Bing Search crawler with indirect Copilot relevance.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Applebot',
    vendor: 'Apple',
    category: 'search_retrieval',
    purpose: 'Apple search crawler for Spotlight, Siri, and Safari surfaces.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Applebot-Extended',
    vendor: 'Apple',
    category: 'training_dataset',
    purpose: 'Robots token controlling Apple generative model training use.',
    robotsTxtSignal: 'policy_token',
  },
  {
    token: 'Amazonbot',
    vendor: 'Amazon',
    category: 'training_dataset',
    purpose: 'Amazon crawler for AI and search services.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Amzn-SearchBot',
    vendor: 'Amazon',
    category: 'search_retrieval',
    purpose: 'Amazon search crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Amzn-User',
    vendor: 'Amazon',
    category: 'user_fetch',
    purpose: 'Amazon user-triggered fetches.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'CCBot',
    vendor: 'Common Crawl',
    category: 'training_dataset',
    purpose: 'Common Crawl dataset crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Meta-ExternalAgent',
    vendor: 'Meta',
    category: 'training_dataset',
    purpose: 'Meta external crawler for AI-related use cases.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Meta-ExternalFetcher',
    vendor: 'Meta',
    category: 'training_dataset',
    purpose: 'Meta external fetcher.',
    robotsTxtSignal: 'limited',
  },
  {
    token: 'Bytespider',
    vendor: 'ByteDance',
    category: 'training_dataset',
    purpose: 'ByteDance crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'cohere-ai',
    vendor: 'Cohere',
    category: 'training_dataset',
    purpose: 'Cohere AI crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Diffbot',
    vendor: 'Diffbot',
    category: 'training_dataset',
    purpose: 'Diffbot crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'AI2Bot',
    vendor: 'Allen Institute for AI',
    category: 'training_dataset',
    purpose: 'AI2 crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Ai2Bot-Dolma',
    vendor: 'Allen Institute for AI',
    category: 'training_dataset',
    purpose: 'AI2 Dolma dataset crawler.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'anthropic-ai',
    vendor: 'Anthropic',
    category: 'legacy',
    purpose: 'Legacy Anthropic robots token.',
    robotsTxtSignal: 'complete',
  },
  {
    token: 'Claude-Web',
    vendor: 'Anthropic',
    category: 'legacy',
    purpose: 'Legacy Claude web robots token.',
    robotsTxtSignal: 'complete',
  },
] as const;

