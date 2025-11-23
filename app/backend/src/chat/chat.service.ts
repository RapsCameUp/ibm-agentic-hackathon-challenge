import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConversationService } from '../conversation/conversation.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RemindersService } from '../reminders/reminders.service';
import { CalendarService } from '../calendar/calendar.service';
import { AudioService } from '../audio/audio.service';
import { Diet1SummaryComponent } from '../diets/diet1-summary.component';
import { Diet2SummaryComponent } from '../diets/diet2-summary.component';
import { WatsonxService, type WatsonxInsights } from '../integrations/watsonx.service';
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
  shareLink: string | null;
  audioPreview: string | null;
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

    const aiReply = await this.generateAssistantReply(conversationId, cleanedInput);
    const insights = await this.generateInsights(conversationId, cleanedInput, aiReply);
    const assistantMessage = {
      id: randomUUID(),
      role: 'assistant' as const,
      content: aiReply,
      timestamp: Date.now(),
    };

    const updatedHistory = this.conversationService.appendMessage(conversationId, assistantMessage);

    const recommendations = this.resolveRecommendations(insights, aiReply);
    const reminders = this.resolveReminders(insights, aiReply);
    const calendarSynced = await this.calendarService.isSynced(conversationId);
    const audioPreview = await this.chatAudioComponent.buildPreview(conversationId, aiReply);
    const diet1Summary = this.resolveDietSummary(insights, 0, this.diet1SummaryComponent);
    const diet2Summary = this.resolveDietSummary(insights, 1, this.diet2SummaryComponent);

    return {
      conversationId,
      reply: aiReply,
      history: this.chatWindowComponent.formatHistory(updatedHistory),
      recommendations,
      reminders,
      calendarSynced,
      shareLink: null,
      audioPreview,
      diet1Summary: diet1Summary as any,
      diet2Summary: diet2Summary as any,
    };
  }

  getConversationHistory(conversationId: string) {
    const history = this.conversationService.getHistory(conversationId);
    return this.chatWindowComponent.formatHistory(history);
  }

  private async generateAssistantReply(conversationId: string, message: string): Promise<string> {
    if (this.watsonxService.isEnabled()) {
      try {
        const result = await this.watsonxService.runAnalysis(conversationId, message);
        if (result.reply) {
          return result.reply;
        }
      } catch (error) {
        this.logger.warn(`Failed to generate WatsonX response: ${String(error)}`);
      }
    }

    return 'Our assistant is processing your message...';
  }

  private async generateInsights(
    conversationId: string,
    userMessage: string,
    aiReply: string,
  ): Promise<WatsonxInsights | null> {
    if (!this.watsonxService.isEnabled()) {
      return null;
    }

    try {
      return await this.watsonxService.generateInsights(conversationId);
    } catch (error) {
      this.logger.warn(`Failed to generate WatsonX insights: ${String(error)}`, { conversationId });
      return null;
    }
  }

  private resolveDietSummary(
    insights: WatsonxInsights | null,
    index: number,
    fallbackProvider: Diet1SummaryComponent | Diet2SummaryComponent,
  ) {
    const plan = insights?.dietPlans?.[index];

    if (!plan) {
      // Return empty structure instead of fallback
      return {
        title: '',
        description: '',
        calories: 0,
        highlights: [],
      };
    }

    return {
      title: plan.title ?? '',
      description: plan.description ?? '',
      calories: plan.calories ?? 0,
      highlights: Array.isArray(plan.highlights) ? plan.highlights : [],
    };
  }

  private resolveRecommendations(insights: WatsonxInsights | null, context: string): string[] {
    if (insights?.recommendations && insights.recommendations.length > 0) {
      return insights.recommendations;
    }

    return [];
  }

  private resolveReminders(insights: WatsonxInsights | null, context: string): string[] {
    if (insights?.reminders && insights.reminders.length > 0) {
      return insights.reminders;
    }

    return [];
  }
}
