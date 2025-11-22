import { Injectable } from '@nestjs/common';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

@Injectable()
export class ConversationService {
  private readonly conversations = new Map<string, ConversationMessage[]>();

  getHistory(conversationId: string): ConversationMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  appendMessage(conversationId: string, message: ConversationMessage): ConversationMessage[] {
    const history = this.conversations.get(conversationId) ?? [];
    const updatedHistory = [...history, message];
    this.conversations.set(conversationId, updatedHistory);
    return updatedHistory;
  }

  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}
