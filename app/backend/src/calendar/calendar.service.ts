import { Injectable } from '@nestjs/common';

@Injectable()
export class CalendarService {
  private readonly syncedConversations = new Set<string>();

  async syncToGoogle(conversationId: string): Promise<boolean> {
    // Placeholder: mark as synced and return success
    this.syncedConversations.add(conversationId);
    return true;
  }

  async isSynced(conversationId: string): Promise<boolean> {
    return this.syncedConversations.has(conversationId);
  }
}
