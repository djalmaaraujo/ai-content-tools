import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AnalysisStore } from './analysis.store';
import { StartAnalysisDto } from './dto/start-analysis.dto';

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

  @Get(':id')
  status(@Param('id') id: string) {
    const record = this.store.get(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }
}

