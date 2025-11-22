import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConversationService } from '../conversation/conversation.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RemindersService } from '../reminders/reminders.service';
import { CalendarService } from '../calendar/calendar.service';
import { ShareService } from '../share/share.service';
import { AudioService } from '../audio/audio.service';
import { Diet1SummaryComponent } from '../diets/diet1-summary.component';
import { Diet2SummaryComponent } from '../diets/diet2-summary.component';
import { WatsonxService } from '../integrations/watsonx.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatWindowComponent } from './components/chat-window.component';
import { ChatAudioComponent } from './components/chat-audio.component';
import { ChatInputComponent } from './components/chat-input.component';

export interface ChatResponse {
  conversationId: string;
  reply: string;
  history: ReturnType<ChatWindowComponent['formatHistory']>;
  recommendations: string[];
  reminders: string[];
  calendarSynced: boolean;
  shareLink: string;
  audioPreview: string;
  diet1Summary: ReturnType<Diet1SummaryComponent['getSummary']>;
  diet2Summary: ReturnType<Diet2SummaryComponent['getSummary']>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly recommendationsService: RecommendationsService,
    private readonly remindersService: RemindersService,
    private readonly calendarService: CalendarService,
    private readonly shareService: ShareService,
    private readonly audioService: AudioService,
    private readonly chatWindowComponent: ChatWindowComponent,
    private readonly chatAudioComponent: ChatAudioComponent,
    private readonly chatInputComponent: ChatInputComponent,
    private readonly diet1SummaryComponent: Diet1SummaryComponent,
    private readonly diet2SummaryComponent: Diet2SummaryComponent,
    private readonly watsonxService: WatsonxService,
  ) {}

  async processMessage(dto: SendMessageDto): Promise<ChatResponse> {
    const conversationId = dto.conversationId ?? randomUUID();
    const cleanedInput = this.chatInputComponent.normalizeInput(dto.message);

    const userMessage = {
      id: randomUUID(),
      role: 'user' as const,
      content: cleanedInput,
      timestamp: Date.now(),
    };

    this.conversationService.appendMessage(conversationId, userMessage);

    const aiReply = await this.generateAssistantReply(cleanedInput);
    const assistantMessage = {
      id: randomUUID(),
      role: 'assistant' as const,
      content: aiReply,
      timestamp: Date.now(),
    };

    const updatedHistory = this.conversationService.appendMessage(conversationId, assistantMessage);

    const recommendations = this.recommendationsService.generateRecommendations(aiReply);
    const reminders = this.remindersService.generateReminders(aiReply);
    const calendarSynced = await this.calendarService.isSynced(conversationId);
    const shareLink = this.shareService.createShareLink(conversationId, aiReply);
    const audioPreview = await this.chatAudioComponent.buildPreview(conversationId, aiReply);
    const diet1Summary = this.diet1SummaryComponent.getSummary();
    const diet2Summary = this.diet2SummaryComponent.getSummary();

    return {
      conversationId,
      reply: aiReply,
      history: this.chatWindowComponent.formatHistory(updatedHistory),
      recommendations,
      reminders,
      calendarSynced,
      shareLink,
      audioPreview,
      diet1Summary,
      diet2Summary,
    };
  }

  getConversationHistory(conversationId: string) {
    const history = this.conversationService.getHistory(conversationId);
    return this.chatWindowComponent.formatHistory(history);
  }

  private async generateAssistantReply(message: string): Promise<string> {
    if (this.watsonxService.isEnabled()) {
      try {
        const response = await this.watsonxService.generateReply(message);
        if (response) {
          return response;
        }
      } catch (error) {
        this.logger.warn(`Failed to generate WatsonX response: ${String(error)}`);
      }
    }

    return 'Our assistant is processing your message...';
  }
}
