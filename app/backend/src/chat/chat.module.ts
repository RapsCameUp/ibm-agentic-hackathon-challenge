import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationModule } from '../conversation/conversation.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { RemindersModule } from '../reminders/reminders.module';
import { CalendarModule } from '../calendar/calendar.module';
import { ShareModule } from '../share/share.module';
import { AudioModule } from '../audio/audio.module';
import { DietsModule } from '../diets/diets.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ChatWindowComponent } from './components/chat-window.component';
import { ChatAudioComponent } from './components/chat-audio.component';
import { ChatInputComponent } from './components/chat-input.component';
import { WatsonxService } from '../integrations/watsonx.service';

@Module({
  imports: [
    ConversationModule,
    RecommendationsModule,
    RemindersModule,
    CalendarModule,
    ShareModule,
    AudioModule,
    DietsModule,
    IntegrationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatWindowComponent, ChatAudioComponent, ChatInputComponent],
  exports: [ChatService],
})
export class ChatModule {}
