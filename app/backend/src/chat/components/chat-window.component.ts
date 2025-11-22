import { Injectable } from '@nestjs/common';
import { ConversationMessage } from '../../conversation/conversation.service';

@Injectable()
export class ChatWindowComponent {
  formatHistory(messages: ConversationMessage[]): Array<{
    role: string;
    content: string;
    timestamp: number;
  }> {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }));
  }
}
