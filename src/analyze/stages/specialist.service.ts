import { Inject, Injectable } from '@nestjs/common';
import {
  ContentAudit,
  ContentAuditSchema,
  EntityAudit,
  EntityAuditSchema,
  TechnicalAudit,
  TechnicalAuditSchema,
} from '../dto/analysis-result.schema';
import {
  CONTENT_GEO_SYSTEM,
  buildContentGeoInput,
} from '../prompts/content-geo.prompt';
import {
  ENTITY_STRATEGIST_SYSTEM,
  buildEntityStrategistInput,
} from '../prompts/entity-strategist.prompt';
import {
  TECHNICAL_AUDITOR_SYSTEM,
  buildTechnicalAuditorInput,
} from '../prompts/technical-auditor.prompt';
import { DeterministicResult } from './deterministic.service';
import {
  STRUCTURED_LLM_PROVIDER,
  StructuredLlmProvider,
} from '../../llm/structured-llm.provider';

@Injectable()
export class SpecialistService {
  constructor(
    @Inject(STRUCTURED_LLM_PROVIDER)
    private readonly llm: StructuredLlmProvider,
  ) {}

  async runTechnical(deterministic: DeterministicResult): Promise<TechnicalAudit> {
    return this.llm.runStructuredCall({
      model: process.env.SPECIALIST_MODEL_TECHNICAL ?? 'gpt-5.4-mini',
      system: TECHNICAL_AUDITOR_SYSTEM,
      userMessage: buildTechnicalAuditorInput(deterministic),
      schemaName: 'TechnicalAudit',
      schema: TechnicalAuditSchema,
      tools: [],
      maxTokens: 4_000,
    });
  }

  async runContent(deterministic: DeterministicResult): Promise<ContentAudit> {
    return this.llm.runStructuredCall({
      model: process.env.SPECIALIST_MODEL_CONTENT ?? 'gpt-5.4-mini',
      system: CONTENT_GEO_SYSTEM,
      userMessage: buildContentGeoInput(deterministic),
      schemaName: 'ContentAudit',
      schema: ContentAuditSchema,
      tools: [],
      maxTokens: 4_000,
    });
  }

  async runEntity(deterministic: DeterministicResult): Promise<EntityAudit> {
    return this.llm.runStructuredCall({
      model: process.env.SPECIALIST_MODEL_ENTITY ?? 'gpt-5.4-mini',
      system: ENTITY_STRATEGIST_SYSTEM,
      userMessage: buildEntityStrategistInput(deterministic),
      schemaName: 'EntityAudit',
      schema: EntityAuditSchema,
      tools: ['web_search'],
      maxTokens: 4_000,
    });
  }
}

