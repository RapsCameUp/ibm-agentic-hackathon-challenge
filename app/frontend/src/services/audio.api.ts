import { apiFetch } from './api';

interface AudioResponse {
  conversationId: string;
  text: string;
  audioStream: string;
}

export async function requestTextToSpeech(
  conversationId: string,
  text: string,
): Promise<AudioResponse> {
  return apiFetch<AudioResponse>('/audio/text-to-speech', {
    method: 'POST',
    body: JSON.stringify({ conversationId, text }),
  });
}
