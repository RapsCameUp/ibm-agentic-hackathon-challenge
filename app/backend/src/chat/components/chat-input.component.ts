import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatInputComponent {
  normalizeInput(input: string): string {
    return input.trim();
  }
}
