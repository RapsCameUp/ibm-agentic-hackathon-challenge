import { Injectable } from '@nestjs/common';

@Injectable()
export class Diet1SummaryComponent {
  getSummary() {
    return this.getFallbackSummary();
  }

  getFallbackSummary() {
    return {
      title: '',
      description: '',
      calories: 0,
      highlights: [],
    };
  }
}
