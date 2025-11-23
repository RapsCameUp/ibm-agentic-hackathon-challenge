import { FASTAPI_BASE_URL } from './api';
import type { ChatMessage } from '../components/ChatWindow';

export interface ChatResponse {
  conversationId: string;
  reply: string;
  history: ChatMessage[];
  recommendations: string[];
  reminders: string[];
  calendarSynced: boolean;
  shareLink: string | null;
  audioPreview: string | null;
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
  agentId?: string;
}): Promise<ChatResponse> {
  const response = await fetch(`${FASTAPI_BASE_URL}/orchestrate-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: payload.message,
      thread_id: payload.conversationId,
      agent_id: payload.agentId, // Pass agentId if provided
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.response?.content || data.content || '';
  const threadId = data.response?.thread_id || data.thread_id || payload.conversationId;

  // Parse insights from content
  const insights = extractJson(content);

  return {
    conversationId: threadId,
    reply: extractText(content), // Remove JSON block from text if needed
    history: [
      {
        id: Date.now().toString(),
        role: 'user',
        content: payload.message,
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: extractText(content),
        timestamp: Date.now(),
      },
    ],
    recommendations: insights?.recommendations || [],
    reminders: insights?.reminders || [],
    calendarSynced: false,
    shareLink: null,
    audioPreview: null,
    diet1Summary: insights?.dietPlans?.[0] || {
      title: '',
      description: '',
      calories: 0,
      highlights: [],
    },
    diet2Summary: insights?.dietPlans?.[1] || {
      title: '',
      description: '',
      calories: 0,
      highlights: [],
    },
  };
}

function extractJson(text: string): any {
  try {
    // Try to find the last JSON object in the text
    // This regex looks for { ... } blocks, potentially nested
    const matches = text.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g);
    if (matches && matches.length > 0) {
      // Iterate backwards to find the first valid JSON that looks like our data
      for (let i = matches.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(matches[i]);
          // Check if it has at least one of our expected keys to confirm it's the right JSON
          if (parsed.dietPlans || parsed.recommendations || parsed.reminders) {
            return parsed;
          }
        } catch (e) {
          // Continue to next match if parsing fails
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse JSON from response', e);
  }
  return null;
}

function extractText(text: string): string {
  // Remove all JSON blocks found
  return text.replace(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g, '').trim();
}

export async function fetchHistory(conversationId: string): Promise<ChatMessage[]> {
  // History endpoint not implemented in FastAPI yet
  return [];
}
