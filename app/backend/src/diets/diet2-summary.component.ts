import { Injectable } from '@nestjs/common';

@Injectable()
export class Diet2SummaryComponent {
  getSummary() {
    return {
      title: 'Diet 2 Summary',
      description: 'Low-carb plan emphasizing healthy fats, leafy greens, and lean proteins.',
      calories: 1800,
      highlights: ['Healthy fats breakfast', 'Leafy green salads', 'Lean protein dinners'],
    };
  }
}
