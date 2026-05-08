import {
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AnalysisStore } from './analysis.store';
import { StartAnalysisDto } from './dto/start-analysis.dto';
import { renderAnalysisReport } from './report.renderer';

@Controller('analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeService: AnalyzeService,
    private readonly store: AnalysisStore,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async start(@Body() dto: StartAnalysisDto): Promise<{ analysisId: string }> {
    const id = await this.analyzeService.startAnalysis(dto.url);
    return { analysisId: id };
  }

  @Get(':id/report')
  @Header('content-type', 'text/html; charset=utf-8')
  report(@Param('id') id: string): string {
    const record = this.store.get(id);
    if (!record) {
      throw new NotFoundException();
    }
    if (record.status !== 'done' || !record.result) {
      throw new ConflictException('Analysis report is not ready yet');
    }
    return renderAnalysisReport(record);
  }

  @Get(':id')
  status(@Param('id') id: string) {
    const record = this.store.get(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }
}
