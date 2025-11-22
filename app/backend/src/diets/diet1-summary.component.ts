import { Injectable } from '@nestjs/common';

@Injectable()
export class Diet1SummaryComponent {
  getSummary() {
    return {
      title: 'Diet 1 Summary',
      description: 'Balanced meal plan focusing on lean proteins, whole grains, and vegetables.',
      calories: 2000,
      highlights: ['High protein breakfast', 'Whole-grain lunch options', 'Vegetable-rich dinners'],
    };
  }
}
