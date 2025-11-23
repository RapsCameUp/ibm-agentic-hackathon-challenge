import { FASTAPI_BASE_URL } from './api';

export interface ShareResponse {
  success: boolean;
  content?: string;
}

export async function shareToWhatsApp(conversationId: string): Promise<ShareResponse> {
  const response = await fetch(`${FASTAPI_BASE_URL}/send-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  });

  if (!response.ok) return { success: false };
  return await response.json();
}
