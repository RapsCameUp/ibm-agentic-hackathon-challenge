import { Controller, Get } from '@nestjs/common';
import { Diet1SummaryComponent } from './diet1-summary.component';
import { Diet2SummaryComponent } from './diet2-summary.component';

@Controller('diets')
export class DietsController {
  constructor(
    private readonly diet1Summary: Diet1SummaryComponent,
    private readonly diet2Summary: Diet2SummaryComponent,
  ) {}

  @Get('diet1')
  getDiet1Summary() {
    return this.diet1Summary.getSummary();
  }

  @Get('diet2')
  getDiet2Summary() {
    return this.diet2Summary.getSummary();
  }

  @Get()
  getAllSummaries() {
    return {
      diet1: this.diet1Summary.getSummary(),
      diet2: this.diet2Summary.getSummary(),
    };
  }
}
