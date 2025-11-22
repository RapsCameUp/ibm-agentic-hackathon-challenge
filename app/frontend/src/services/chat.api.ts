import { apiFetch } from './api';
import type { ChatMessage } from '../components/ChatWindow';

export interface ChatResponse {
  conversationId: string;
  reply: string;
  history: ChatMessage[];
  recommendations: string[];
  reminders: string[];
  calendarSynced: boolean;
  shareLink: string;
  audioPreview: string;
  diet1Summary: DietSummary;
  diet2Summary: DietSummary;
}

export interface DietSummary {
  title: string;
  description: string;
  calories: number;
  highlights: string[];
}

export async function sendMessage(payload: {
  conversationId?: string;
  message: string;
}): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/chat/message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchHistory(conversationId: string): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/chat/history/${conversationId}`);
}
