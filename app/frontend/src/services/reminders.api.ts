import { apiFetch } from './api';

export interface ReminderItem {
  id: string;
  message: string;
  editable: boolean;
}

export async function listReminders(conversationId: string): Promise<ReminderItem[]> {
  const response = await apiFetch<{ reminders: ReminderItem[] }>(`/reminders/${conversationId}`);
  return response.reminders;
}

export async function saveReminders(
  conversationId: string,
  reminders: ReminderItem[],
): Promise<ReminderItem[]> {
  const response = await apiFetch<{ reminders: ReminderItem[] }>(`/reminders/${conversationId}`, {
    method: 'POST',
    body: JSON.stringify({ reminders }),
  });
  return response.reminders;
}
