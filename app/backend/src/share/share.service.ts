import { Injectable } from '@nestjs/common';
import { WatsonxService } from '../integrations/watsonx.service';

@Injectable()
export class ShareService {
  constructor(private readonly watsonxService: WatsonxService) {}

  async shareToWhatsApp(
    conversationId: string,
  ): Promise<{ success: boolean; content?: string | null }> {
    if (!this.watsonxService.isEnabled()) {
      return { success: false, content: 'WatsonX integration disabled' };
    }

    try {
      const response = await this.watsonxService.sendWhatsAppMessage(conversationId);
      return {
        success: Boolean(response.success),
        content: response.content ?? response.message ?? null,
      };
    } catch (error) {
      return { success: false, content: (error as Error).message };
    }
  }
}
