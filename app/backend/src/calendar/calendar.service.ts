import { Injectable, Logger } from '@nestjs/common';
import { WatsonxService } from '../integrations/watsonx.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly syncedConversations = new Set<string>();

  constructor(private readonly watsonxService: WatsonxService) {}

  async syncToGoogle(conversationId: string): Promise<boolean> {
    try {
      const result = await this.watsonxService.addCalendarEvents(conversationId);
      if (result.success) {
        this.syncedConversations.add(conversationId);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to sync calendar via FastAPI', error as Error);
      return false;
    }
  }

  async isSynced(conversationId: string): Promise<boolean> {
    return this.syncedConversations.has(conversationId);
  }
}
