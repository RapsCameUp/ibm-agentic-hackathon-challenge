import { Module } from '@nestjs/common';
import { Diet1SummaryComponent } from './diet1-summary.component';
import { Diet2SummaryComponent } from './diet2-summary.component';
import { DietsController } from './diets.controller';

@Module({
  controllers: [DietsController],
  providers: [Diet1SummaryComponent, Diet2SummaryComponent],
  exports: [Diet1SummaryComponent, Diet2SummaryComponent],
})
export class DietsModule {}
