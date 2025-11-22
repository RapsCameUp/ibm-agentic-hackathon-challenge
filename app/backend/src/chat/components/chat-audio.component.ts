import { Injectable } from '@nestjs/common';
import { AudioService } from '../../audio/audio.service';

@Injectable()
export class ChatAudioComponent {
  constructor(private readonly audioService: AudioService) {}

  async buildPreview(conversationId: string, text: string): Promise<string> {
    const audio = await this.audioService.textToSpeech(conversationId, text);
    return audio.audioStream;
  }
}
