import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { AnalysisStore } from './analysis.store';
import { DeterministicService } from './stages/deterministic.service';
import { SpecialistService } from './stages/specialist.service';
import { SynthesizerService } from './stages/synthesizer.service';

@Module({
  imports: [LlmModule],
  controllers: [AnalyzeController],
  providers: [
    AnalyzeService,
    AnalysisStore,
    DeterministicService,
    SpecialistService,
    SynthesizerService,
  ],
})
export class AnalyzeModule {}
