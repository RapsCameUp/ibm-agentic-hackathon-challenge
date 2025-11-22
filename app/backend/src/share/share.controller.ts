import { Body, Controller, Post } from '@nestjs/common';
import { ShareService } from './share.service';

interface SharePayload {
  conversationId: string;
  message: string;
}

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('whatsapp')
  shareToWhatsApp(@Body() payload: SharePayload) {
    const preview = payload.message || '';
    return {
      url: this.shareService.createShareLink(payload.conversationId, preview),
    };
  }
}
