import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyzeModule } from './analyze/analyze.module';
import { HealthController } from './health/health.controller';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 50 }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    LlmModule,
    AnalyzeModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

