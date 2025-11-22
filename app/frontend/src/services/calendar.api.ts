import { apiFetch } from './api';

export async function syncToGoogle(conversationId: string): Promise<boolean> {
  const response = await apiFetch<{ success: boolean }>(`/calendar/sync/${conversationId}`, {
    method: 'POST',
  });
  return response.success;
}

export async function isSynced(conversationId: string): Promise<boolean> {
  const response = await apiFetch<{ synced: boolean }>(`/calendar/synced/${conversationId}`);
  return response.synced;
}
