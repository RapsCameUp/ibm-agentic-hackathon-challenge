import React, { useMemo, useState } from 'react';
import ChatWindow, { ChatMessage } from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import ChatAudio from '../components/ChatAudio';
import DietSummary1 from '../components/DietSummary1';
import DietSummary2 from '../components/DietSummary2';
import Recommendations from '../components/Recommendations';
import Reminders from '../components/Reminders';
import SyncGoogleCalendar from '../components/SyncGoogleCalendar';
import ShareWhatsApp from '../components/ShareWhatsApp';
import { sendMessage, type ChatResponse, type DietSummary } from '../services/chat.api';
import { syncToGoogle } from '../services/calendar.api';
import { shareToWhatsApp, type ShareResponse } from '../services/share.api';
import '../styles/chatpage.css';

const ChatPage: React.FC = () => {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [diet1Summary, setDiet1Summary] = useState<DietSummary | null>(null);
  const [diet2Summary, setDiet2Summary] = useState<DietSummary | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [calendarSynced, setCalendarSynced] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState<boolean>(false);

  const lastAssistantReply = useMemo(() => {
    return [...messages].reverse().find((item) => item.role === 'assistant');
  }, [messages]);

  // Load initial state from local storage (populated by MedicalIntakeForm)
  React.useEffect(() => {
    const storedThreadId = localStorage.getItem('chat_thread_id');
    const storedAnalysis = localStorage.getItem('health_analysis');

    if (storedThreadId) {
      setConversationId(storedThreadId);
    }

    if (storedAnalysis) {
      try {
        // Reuse the extraction logic or just parse if it's pure JSON
        // The stored analysis might be the raw content string which could contain JSON + text
        let insights = null;

        // Try parsing as pure JSON first
        try {
          insights = JSON.parse(storedAnalysis);
        } catch (e) {
          // If failed, try extracting JSON block
          const jsonMatch = storedAnalysis.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
          if (jsonMatch) {
            try {
              insights = JSON.parse(jsonMatch[0]);
            } catch (innerE) {
              console.error('Failed to parse extracted JSON from stored analysis', innerE);
            }
          }
        }

        if (insights) {
          if (insights.dietPlans) {
            setDiet1Summary(insights.dietPlans[0]);
            setDiet2Summary(insights.dietPlans[1]);
          }
          if (insights.recommendations) setRecommendations(insights.recommendations);
          if (insights.reminders) setReminders(insights.reminders);
        }

        // Add the analysis as the first message
        setMessages([
          {
            id: 'init-analysis',
            role: 'assistant',
            content:
              storedAnalysis.replace(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g, '').trim() ||
              'Here is your initial health analysis based on the form.',
            timestamp: Date.now(),
          },
        ]);
      } catch (e) {
        console.error('Failed to parse stored analysis', e);
      }
    }
  }, []);

  const handleSendMessage = async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendMessage({
        conversationId,
        message,
        agentId: '9c7db189-b302-471d-953c-8f31583446b0', // Explicitly use the working agent ID
      });
      updateStateWithResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const updateStateWithResponse = (response: ChatResponse) => {
    setConversationId(response.conversationId);

    // Append new messages to history
    setMessages((prev) => {
      // Avoid duplicates if any
      const newMsgs = response.history.filter((nm) => !prev.some((pm) => pm.id === nm.id));
      return [...prev, ...newMsgs];
    });

    // Only update insights if they are present in the response
    if (response.diet1Summary && response.diet1Summary.title) {
      setDiet1Summary(response.diet1Summary);
    }
    if (response.diet2Summary && response.diet2Summary.title) {
      setDiet2Summary(response.diet2Summary);
    }
    if (response.recommendations && response.recommendations.length > 0) {
      setRecommendations(response.recommendations);
    }
    if (response.reminders && response.reminders.length > 0) {
      setReminders(response.reminders);
    }

    setAudioPreview(response.audioPreview ?? null);
    setShareLink(response.shareLink ? response.shareLink : null);
    setShareStatus(null);
    setCalendarSynced(response.calendarSynced ?? false);
  };

  const handleSyncCalendar = async () => {
    if (!conversationId) {
      setError('Send a message first before syncing the calendar.');
      return;
    }

    try {
      const success = await syncToGoogle(conversationId);
      setCalendarSynced(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error syncing calendar.');
    }
  };

  const handleShareWhatsApp = async () => {
    if (!conversationId) {
      setError('Send a message first before sharing.');
      return;
    }

    try {
      setShareLoading(true);
      setError(null);
      setShareStatus(null);

      const result: ShareResponse = await shareToWhatsApp(conversationId);

      if (result.success) {
        const content = result.content ?? '';

        if (content) {
          if (isProbablyUrl(content)) {
            setShareLink(content);
            window.open(content, '_blank', 'noopener');
            setShareStatus('WhatsApp share link opened in a new tab.');
          } else {
            setShareLink(null);
            setShareStatus(content);
          }
        } else {
          setShareLink(null);
          setShareStatus('WhatsApp agent responded without additional content.');
        }
      } else {
        setShareLink(null);
        setShareStatus(result.content ?? 'WhatsApp agent could not complete the request.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate the sharing link.');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-page__container">
        <div className="chat-page__left">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold">Chat</h2>
            <button
              onClick={() => {
                localStorage.removeItem('chat_thread_id');
                localStorage.removeItem('health_analysis');
                setConversationId(undefined);
                setMessages([]);
                setDiet1Summary(null);
                setDiet2Summary(null);
                setRecommendations([]);
                setReminders([]);
                window.location.reload();
              }}
              className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
            >
              Reset Chat
            </button>
          </div>
          <ChatWindow messages={messages} />
          <ChatAudio audioPreview={audioPreview} />
          <ChatInput onSend={handleSendMessage} disabled={loading} />
          {loading && <div className="chat-status">Sending…</div>}
          {error && <div className="chat-error">{error}</div>}
        </div>
        <div className="chat-page__right">
          <div className="chat-page__diet-grid">
            <DietSummary1 summary={diet1Summary} />
            <DietSummary2 summary={diet2Summary} />
          </div>
          <Recommendations items={recommendations} />
          <Reminders reminders={reminders} />
          <SyncGoogleCalendar onSync={handleSyncCalendar} synced={calendarSynced} />
          <ShareWhatsApp
            onShare={handleShareWhatsApp}
            loading={shareLoading}
            status={shareStatus ?? (shareLink ? `Last link: ${shareLink}` : null)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

function isProbablyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return /^https?:\/\//i.test(value);
  }
}
