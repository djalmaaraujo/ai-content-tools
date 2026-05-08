import { IsString } from 'class-validator';

export class StartAnalysisDto {
  @IsString()
  url!: string;
}

