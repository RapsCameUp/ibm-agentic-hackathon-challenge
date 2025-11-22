import { Module } from '@nestjs/common';
import { ChatModule } from './src/chat/chat.module';
import { ConversationModule } from './src/conversation/conversation.module';
import { AudioModule } from './src/audio/audio.module';
import { DietsModule } from './src/diets/diets.module';
import { RecommendationsModule } from './src/recommendations/recommendations.module';
import { RemindersModule } from './src/reminders/reminders.module';
import { CalendarModule } from './src/calendar/calendar.module';
import { ShareModule } from './src/share/share.module';

@Module({
  imports: [
    ChatModule,
    ConversationModule,
    AudioModule,
    DietsModule,
    RecommendationsModule,
    RemindersModule,
    CalendarModule,
    ShareModule,
  ],
})
export class AppModule {}
