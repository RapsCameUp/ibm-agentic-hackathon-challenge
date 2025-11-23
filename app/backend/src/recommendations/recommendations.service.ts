import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationsService {
  getFallbackRecommendations(context: string): string[] {
    return [];
  }

  generateRecommendations(context: string): string[] {
    return this.getFallbackRecommendations(context);
  }
}
