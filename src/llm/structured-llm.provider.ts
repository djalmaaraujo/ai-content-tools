import { z } from 'zod';

export type LlmTool = 'web_search' | 'web_fetch';

export interface StructuredLlmCall<T> {
  model: string;
  system: string;
  userMessage: string;
  schemaName: string;
  schema: z.ZodType<T>;
  tools: LlmTool[];
  maxTokens: number;
}

export abstract class StructuredLlmProvider {
  abstract runStructuredCall<T>(args: StructuredLlmCall<T>): Promise<T>;
}

export const STRUCTURED_LLM_PROVIDER = Symbol('STRUCTURED_LLM_PROVIDER');

