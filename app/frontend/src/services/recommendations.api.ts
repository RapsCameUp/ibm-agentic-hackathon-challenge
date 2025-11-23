import { apiFetch } from './api';

export async function generateRecommendations(context: string): Promise<string[]> {
  const response = await apiFetch<{ items: string[] }>('/recommendations/generate', {
    method: 'POST',
    body: JSON.stringify({ context }),
  });
  return response.items;
}
