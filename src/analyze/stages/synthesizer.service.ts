import { Inject, Injectable } from '@nestjs/common';
import {
  ContentAudit,
  EntityAudit,
  FinalReport,
  FinalReportSchema,
  TechnicalAudit,
} from '../dto/analysis-result.schema';
import {
  SYNTHESIZER_SYSTEM,
  buildSynthesizerInput,
} from '../prompts/synthesizer.prompt';
import { DeterministicResult } from './deterministic.service';
import {
  STRUCTURED_LLM_PROVIDER,
  StructuredLlmProvider,
} from '../../llm/structured-llm.provider';

@Injectable()
export class SynthesizerService {
  constructor(
    @Inject(STRUCTURED_LLM_PROVIDER)
    private readonly llm: StructuredLlmProvider,
  ) {}

  async run(input: {
    url: string;
    deterministic: DeterministicResult;
    technical: TechnicalAudit;
    content: ContentAudit;
    entity: EntityAudit;
  }): Promise<FinalReport> {
    return this.llm.runStructuredCall({
      model: process.env.SYNTHESIZER_MODEL ?? 'gpt-5.4-mini',
      system: SYNTHESIZER_SYSTEM,
      userMessage: buildSynthesizerInput(input),
      schemaName: 'FinalReport',
      schema: FinalReportSchema,
      tools: [],
      maxTokens: 4_000,
    });
  }
}

