import { apiFetch } from './api';

export async function shareToWhatsApp(conversationId: string, message: string): Promise<string> {
  const response = await apiFetch<{ url: string }>('/share/whatsapp', {
    method: 'POST',
    body: JSON.stringify({ conversationId, message }),
  });
  return response.url;
}
