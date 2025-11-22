import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService, ChatResponse } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto): Promise<ChatResponse> {
    return this.chatService.processMessage(dto);
  }

  @Get('history/:conversationId')
  async getHistory(@Param('conversationId') conversationId: string) {
    return this.chatService.getConversationHistory(conversationId);
  }
}
