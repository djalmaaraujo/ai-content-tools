import { Injectable } from '@nestjs/common';
import { fetch } from 'undici';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { StructuredLlmCall, StructuredLlmProvider } from './structured-llm.provider';

interface OpenAiTextBlock {
  type?: string;
  text?: string;
}

interface OpenAiOutputItem {
  content?: OpenAiTextBlock[];
}

interface OpenAiResponse {
  output_text?: string;
  output?: OpenAiOutputItem[];
}

@Injectable()
export class OpenAiStructuredLlmProvider extends StructuredLlmProvider {
  async runStructuredCall<T>(args: StructuredLlmCall<T>): Promise<T> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for live LLM analysis');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: args.model,
        input: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.userMessage },
        ],
        max_output_tokens: args.maxTokens,
        tools: toOpenAiTools(args.tools),
        text: {
          format: {
            type: 'json_schema',
            name: args.schemaName,
            schema: toJsonSchema(args),
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenAI Responses API failed with HTTP ${response.status}: ${sanitizeOpenAiErrorBody(body)}`,
      );
    }

    const payload = (await response.json()) as OpenAiResponse;
    const text = extractOutputText(payload);
    const parsed = JSON.parse(text) as unknown;
    return args.schema.parse(parsed);
  }
}

function sanitizeOpenAiErrorBody(body: string): string {
  return body.replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***').slice(0, 1_000);
}

function toJsonSchema(args: StructuredLlmCall<unknown>): unknown {
  const schema = args.schema as unknown as Parameters<typeof zodToJsonSchema>[0];
  const jsonSchema = zodToJsonSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return inlineLocalRefs(jsonSchema);
}

function inlineLocalRefs(root: unknown): unknown {
  return inlineValue(root, root, new Set<string>());
}

function inlineValue(value: unknown, root: unknown, seenRefs: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => inlineValue(item, root, seenRefs));
  }

  if (!isRecord(value)) {
    return value;
  }

  const ref = value.$ref;
  if (typeof ref === 'string' && ref.startsWith('#/')) {
    if (seenRefs.has(ref)) {
      throw new Error(`Circular JSON schema reference: ${ref}`);
    }
    const nextSeen = new Set(seenRefs);
    nextSeen.add(ref);
    return inlineValue(resolveJsonPointer(root, ref), root, nextSeen);
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === '$schema' || key === 'definitions') {
      continue;
    }
    result[key] = inlineValue(item, root, seenRefs);
  }
  return result;
}

function resolveJsonPointer(root: unknown, pointer: string): unknown {
  const segments = pointer
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = root;

  for (const segment of segments) {
    if (!isRecord(current) && !Array.isArray(current)) {
      throw new Error(`Invalid JSON schema reference: ${pointer}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (current === undefined) {
    throw new Error(`Invalid JSON schema reference: ${pointer}`);
  }

  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toOpenAiTools(tools: StructuredLlmCall<unknown>['tools']): Array<Record<string, string>> {
  return tools.map((tool) => {
    if (tool === 'web_search') {
      return { type: 'web_search_preview' };
    }
    return { type: 'web_fetch' };
  });
}

function extractOutputText(payload: OpenAiResponse): string {
  if (payload.output_text) {
    return payload.output_text;
  }

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((block) => block.type === 'output_text' || block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('OpenAI response did not include output text');
  }

  return text;
}
