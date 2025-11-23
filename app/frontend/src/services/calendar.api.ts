import { FASTAPI_BASE_URL } from './api';

export async function syncToGoogle(conversationId: string): Promise<boolean> {
  const response = await fetch(`${FASTAPI_BASE_URL}/add-calendar-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: conversationId }),
  });

  if (!response.ok) return false;
  const data = await response.json();
  return data.success === true;
}

export async function isSynced(conversationId: string): Promise<boolean> {
  // Not implemented in FastAPI yet
  return false;
}
