import { Controller, Get, Param, Post } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('sync/:conversationId')
  async sync(@Param('conversationId') conversationId: string) {
    const success = await this.calendarService.syncToGoogle(conversationId);
    return { success };
  }

  @Get('synced/:conversationId')
  async isSynced(@Param('conversationId') conversationId: string) {
    return { synced: await this.calendarService.isSynced(conversationId) };
  }
}
