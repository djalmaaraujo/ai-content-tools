import { Injectable, OnModuleDestroy } from '@nestjs/common';

export type AnalysisStatus =
  | 'queued'
  | 'fetching'
  | 'analyzing'
  | 'synthesizing'
  | 'done'
  | 'error';

export interface AnalysisError {
  message: string;
  stage: string;
  retryable: boolean;
}

export interface AnalysisRecord {
  id: string;
  url: string;
  status: AnalysisStatus;
  progress: number;
  botRegistryVersion: string;
  result?: unknown;
  error?: AnalysisError;
  createdAt: string;
  updatedAt: string;
}

export type AnalysisRecordInit = Pick<
  AnalysisRecord,
  'url' | 'status' | 'progress' | 'botRegistryVersion'
>;

@Injectable()
export class AnalysisStore implements OnModuleDestroy {
  private readonly records = new Map<string, AnalysisRecord>();
  private readonly interval: NodeJS.Timeout;
  private readonly ttlMs = Number(process.env.ANALYSIS_TTL_MS ?? 86_400_000);

  constructor() {
    this.interval = setInterval(() => this.gc(), 60 * 60 * 1000);
    this.interval.unref();
  }

  create(id: string, init: AnalysisRecordInit): AnalysisRecord {
    const now = new Date().toISOString();
    const record: AnalysisRecord = {
      id,
      ...init,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, record);
    return record;
  }

  update(id: string, patch: Partial<Omit<AnalysisRecord, 'id' | 'createdAt'>>): void {
    const existing = this.records.get(id);
    if (!existing) {
      return;
    }
    this.records.set(id, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  get(id: string): AnalysisRecord | undefined {
    return this.records.get(id);
  }

  dispose(): void {
    clearInterval(this.interval);
  }

  onModuleDestroy(): void {
    this.dispose();
  }

  private gc(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [id, record] of this.records.entries()) {
      if (Date.parse(record.updatedAt) < cutoff) {
        this.records.delete(id);
      }
    }
  }
}
