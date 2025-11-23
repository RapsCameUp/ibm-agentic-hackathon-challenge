import { Body, Controller, Post } from '@nestjs/common';
import { AudioService } from './audio.service';

interface TextToSpeechPayload {
  conversationId: string;
  text: string;
}

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('text-to-speech')
  async textToSpeech(@Body() payload: TextToSpeechPayload) {
    return this.audioService.textToSpeech(payload.conversationId, payload.text);
  }
}
