import { Body, Controller, Post } from '@nestjs/common';
import { ShareService } from './share.service';

interface SharePayload {
  conversationId: string;
}

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('whatsapp')
  shareToWhatsApp(@Body() payload: SharePayload) {
    return this.shareService.shareToWhatsApp(payload.conversationId);
  }
}
