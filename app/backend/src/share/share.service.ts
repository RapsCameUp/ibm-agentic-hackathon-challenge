import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareService {
  shareToWhatsApp(message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
  }

  createShareLink(conversationId: string, message: string): string {
    const preview = message.slice(0, 100);
    return this.shareToWhatsApp(`Conversation ${conversationId}: ${preview}`);
  }
}
