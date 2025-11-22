import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationsService {
  generateRecommendations(context: string): string[] {
    const baseRecommendations = [
      'Increase daily water intake to 2L',
      'Add a 20-minute walk to your routine',
      'Include a serving of leafy greens with lunch',
    ];

    if (context.toLowerCase().includes('energy')) {
      baseRecommendations.push('Consider a mid-afternoon protein snack to sustain energy');
    }

    if (context.toLowerCase().includes('stress')) {
      baseRecommendations.push('Schedule a short mindfulness session after work hours');
    }

    return baseRecommendations;
  }
}
