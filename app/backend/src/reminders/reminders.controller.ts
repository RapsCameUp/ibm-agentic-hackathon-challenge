import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RemindersService, ReminderItem } from './reminders.service';

interface SaveRemindersPayload {
  reminders: ReminderItem[];
}

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get(':conversationId')
  list(@Param('conversationId') conversationId: string) {
    return {
      reminders: this.remindersService.listReminders(conversationId),
    };
  }

  @Post(':conversationId')
  save(@Param('conversationId') conversationId: string, @Body() payload: SaveRemindersPayload) {
    this.remindersService.saveReminders(conversationId, payload.reminders ?? []);
    return {
      reminders: this.remindersService.listReminders(conversationId),
    };
  }
}
