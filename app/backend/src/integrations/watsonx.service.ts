import { Injectable, Logger } from '@nestjs/common';
import fetch from 'cross-fetch';

interface OrchestrateRunResponse {
  success: boolean;
  status_code?: number;
  thread_id?: string | null;
  run_id?: string;
  content?: string | null;
  analysis?: string | null;
  message?: string | null;
  raw_response?: string | null;
}

interface WatsonxChatResult {
  reply: string;
  threadId?: string;
  raw: OrchestrateRunResponse;
}

interface AgentActionResponse {
  success: boolean;
  message?: string | null;
  content?: string | null;
  thread_id?: string | null;
}

export interface WatsonxDietPlan {
  title: string;
  description: string;
  calories?: number | null;
  highlights?: string[];
}

export interface WatsonxInsights {
  dietPlans: WatsonxDietPlan[];
  recommendations: string[];
  reminders: string[];
}

@Injectable()
export class WatsonxService {
  private readonly logger = new Logger(WatsonxService.name);
  private readonly baseUrl = (process.env.FASTAPI_BASE_URL || 'http://localhost:8000').replace(
    /\/$/,
    '',
  );
  private readonly analysisAgentId = process.env.ANALYSIS_AGENT_ID?.trim();
  private readonly threadByConversation = new Map<string, string>();

  isEnabled(): boolean {
    return true; // Rely on FastAPI backend configuration
  }

  getThreadId(conversationId: string): string | undefined {
    return this.threadByConversation.get(conversationId);
  }

  hasThread(conversationId: string): boolean {
    return this.threadByConversation.has(conversationId);
  }

  clearThread(conversationId: string): void {
    this.threadByConversation.delete(conversationId);
  }

  async runAnalysis(conversationId: string, message: string): Promise<WatsonxChatResult> {
    // We allow analysisAgentId to be undefined here, assuming FastAPI has a default
    const persistedThread = this.threadByConversation.get(conversationId);
    const payload = {
      message,
      agent_id: this.analysisAgentId || null,
      thread_id: persistedThread ?? null,
    };

    const response = await this.post<OrchestrateRunResponse>('/orchestrate-run', payload);

    if (!response.success) {
      throw new Error(
        `FastAPI orchestrate-run returned an error (status: ${response.status_code ?? 'unknown'})`,
      );
    }

    const nextThreadId = response.thread_id ?? persistedThread;
    if (nextThreadId) {
      this.threadByConversation.set(conversationId, nextThreadId);
    }

    const primaryText = this.extractContent(
      response.content ?? response.analysis ?? response.message ?? '',
    );

    return {
      reply: primaryText,
      threadId: nextThreadId ?? undefined,
      raw: response,
    };
  }

  async sendWhatsAppMessage(conversationId: string): Promise<AgentActionResponse> {
    const threadId = this.requireThread(conversationId);
    // FastAPI expects 'conversationId' field which carries the thread_id
    return this.post<AgentActionResponse>('/send-whatsapp', { conversationId: threadId });
  }

  async addCalendarEvents(conversationId: string): Promise<AgentActionResponse> {
    const threadId = this.requireThread(conversationId);
    return this.post<AgentActionResponse>('/add-calendar-events', { thread_id: threadId });
  }

  async generateInsights(conversationId: string): Promise<WatsonxInsights> {
    if (!this.hasThread(conversationId)) {
      throw new Error(
        `No WatsonX thread found for conversation ${conversationId}. Run analysis before requesting insights.`,
      );
    }

    const prompt =
      'Analyse la conversation complète à ce stade et réponds UNIQUEMENT avec un objet JSON strict respectant exactement la structure suivante, sans aucun texte supplémentaire :\n' +
      '{\n' +
      '  "dietPlans": [\n' +
      '    {\n' +
      '      "title": string,\n' +
      '      "description": string,\n' +
      '      "calories": number,\n' +
      '      "highlights": [string, ...]\n' +
      '    },\n' +
      '    ...\n' +
      '  ],\n' +
      '  "recommendations": [string, ...],\n' +
      '  "reminders": [string, ...]\n' +
      '}\n' +
      'Le JSON doit être valide, sans commentaire, sans trailing commas.';

    const result = await this.runAnalysis(conversationId, prompt);
    const payload = this.extractJsonPayload(result.reply);

    if (!payload) {
      this.logger.warn('WatsonX insights response did not contain JSON payload.', {
        reply: result.reply,
      });
      return { dietPlans: [], recommendations: [], reminders: [] };
    }

    try {
      const parsed = JSON.parse(payload) as Partial<WatsonxInsights>;
      return {
        dietPlans: Array.isArray(parsed.dietPlans) ? parsed.dietPlans : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      };
    } catch (error) {
      this.logger.warn('Unable to parse WatsonX insights JSON payload.', error as Error);
      return { dietPlans: [], recommendations: [], reminders: [] };
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FastAPI request failed (${response.status}): ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      this.logger.error(`FastAPI POST ${path} failed`, error as Error);
      throw error;
    }
  }

  private requireThread(conversationId: string): string {
    const threadId = this.threadByConversation.get(conversationId);
    if (!threadId) {
      throw new Error(
        `No WatsonX thread found for conversation ${conversationId}. Ensure runAnalysis was called first.`,
      );
    }

    return threadId;
  }

  private extractContent(raw: string): string {
    if (!raw) {
      return '';
    }

    const segments: string[] = [];
    const regex = /['"]text['"]\s*:\s*(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(raw)) !== null) {
      const text = (match[1] ?? match[2] ?? '')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
      segments.push(text);
    }

    if (segments.length === 0) {
      return raw.trim();
    }

    return segments.join('').trim();
  }

  private extractJsonPayload(raw: string): string | null {
    if (!raw) {
      return null;
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : null;
  }
}
