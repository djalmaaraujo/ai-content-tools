import { Module } from '@nestjs/common';
import { OpenAiStructuredLlmProvider } from './openai-structured-llm.provider';
import { STRUCTURED_LLM_PROVIDER } from './structured-llm.provider';

@Module({
  providers: [
    OpenAiStructuredLlmProvider,
    {
      provide: STRUCTURED_LLM_PROVIDER,
      useExisting: OpenAiStructuredLlmProvider,
    },
  ],
  exports: [STRUCTURED_LLM_PROVIDER],
})
export class LlmModule {}

