import { Injectable } from '@nestjs/common';

export interface ReminderItem {
  id: string;
  message: string;
  editable: boolean;
}

@Injectable()
export class RemindersService {
  private readonly remindersByConversation = new Map<string, ReminderItem[]>();

  generateReminders(context: string): string[] {
    const baseReminders = ['Take a 5-minute break every hour', 'Log your meals after each meal'];

    if (context.toLowerCase().includes('sleep')) {
      baseReminders.push('Set a reminder to wind down 30 minutes before bedtime');
    }

    return baseReminders;
  }

  listReminders(conversationId: string): ReminderItem[] {
    return this.remindersByConversation.get(conversationId) ?? [];
  }

  saveReminders(conversationId: string, reminders: ReminderItem[]): void {
    this.remindersByConversation.set(conversationId, reminders);
  }
}
