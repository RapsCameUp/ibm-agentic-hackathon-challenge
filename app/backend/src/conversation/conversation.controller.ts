import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { ConversationMessage } from './conversation.service';
import { ConversationService } from './conversation.service';
import { AppendMessageDto } from './dto/append-message.dto';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get(':conversationId')
  getHistory(@Param('conversationId') conversationId: string): ConversationMessage[] {
    return this.conversationService.getHistory(conversationId);
  }

  @Delete(':conversationId')
  clearHistory(@Param('conversationId') conversationId: string): void {
    this.conversationService.clearConversation(conversationId);
  }

  @Post(':conversationId/append')
  appendMessage(
    @Param('conversationId') conversationId: string,
    @Body() message: AppendMessageDto,
  ): ConversationMessage[] {
    return this.conversationService.appendMessage(conversationId, {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp ?? Date.now(),
    });
  }
}
