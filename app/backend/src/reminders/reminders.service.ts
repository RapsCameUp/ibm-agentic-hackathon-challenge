import { Injectable } from '@nestjs/common';

export interface ReminderItem {
  id: string;
  message: string;
  editable: boolean;
}

@Injectable()
export class RemindersService {
  private readonly remindersByConversation = new Map<string, ReminderItem[]>();

  getFallbackReminders(context: string): string[] {
    return [];
  }

  generateReminders(context: string): string[] {
    return this.getFallbackReminders(context);
  }

  listReminders(conversationId: string): ReminderItem[] {
    return this.remindersByConversation.get(conversationId) ?? [];
  }

  saveReminders(conversationId: string, reminders: ReminderItem[]): void {
    this.remindersByConversation.set(conversationId, reminders);
  }
}
