import { Body, Controller, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

interface GenerateRecommendationsPayload {
  context: string;
}

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('generate')
  generate(@Body() payload: GenerateRecommendationsPayload) {
    return {
      items: this.recommendationsService.generateRecommendations(payload.context ?? ''),
    };
  }
}
