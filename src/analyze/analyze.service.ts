import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { randomBytes } from 'node:crypto';
import { BOT_REGISTRY_VERSION } from './bots/ai-bot-registry';
import { AnalysisStore } from './analysis.store';
import { normalizeAnalyzeUrl } from '../common/url-safety';
import { DeterministicService } from './stages/deterministic.service';
import { SpecialistService } from './stages/specialist.service';
import { SynthesizerService } from './stages/synthesizer.service';

interface AnalysisStartEvent {
  id: string;
  url: string;
}

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name);

  constructor(
    private readonly store: AnalysisStore,
    private readonly events: EventEmitter2,
    private readonly deterministic: DeterministicService,
    private readonly specialist: SpecialistService,
    private readonly synthesizer: SynthesizerService,
  ) {}

  async startAnalysis(inputUrl: string): Promise<string> {
    let normalized: ReturnType<typeof normalizeAnalyzeUrl>;
    try {
      normalized = normalizeAnalyzeUrl(inputUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid URL';
      throw new BadRequestException(message);
    }

    const id = randomBytes(9).toString('base64url');
    this.store.create(id, {
      url: normalized.targetUrl,
      status: 'queued',
      progress: 0,
      botRegistryVersion: BOT_REGISTRY_VERSION,
    });
    this.events.emit('analysis.start', { id, url: normalized.targetUrl });
    return id;
  }

  @OnEvent('analysis.start', { async: true })
  async runPipeline(event: AnalysisStartEvent): Promise<void> {
    const { id, url } = event;
    try {
      this.store.update(id, { status: 'fetching', progress: 10 });
      const deterministic = await this.deterministic.run(url);

      this.store.update(id, { status: 'analyzing', progress: 30 });
      const [technical, content, entity] = await Promise.all([
        this.specialist.runTechnical(deterministic),
        this.specialist.runContent(deterministic),
        this.specialist.runEntity(deterministic),
      ]);

      this.store.update(id, { status: 'synthesizing', progress: 80 });
      const result = await this.synthesizer.run({
        url,
        deterministic,
        technical,
        content,
        entity,
      });

      this.store.update(id, { status: 'done', progress: 100, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown analysis error';
      this.logger.error(`Analysis ${id} failed: ${message}`);
      this.store.update(id, {
        status: 'error',
        error: { message, stage: 'pipeline', retryable: true },
      });
    }
  }
}

