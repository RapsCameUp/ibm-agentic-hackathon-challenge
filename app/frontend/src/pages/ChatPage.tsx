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
import { shareToWhatsApp } from '../services/share.api';
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

  const lastAssistantReply = useMemo(() => {
    return [...messages].reverse().find((item) => item.role === 'assistant');
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendMessage({ conversationId, message });
      updateStateWithResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const updateStateWithResponse = (response: ChatResponse) => {
    setConversationId(response.conversationId);
    setMessages(response.history);
    setDiet1Summary(response.diet1Summary);
    setDiet2Summary(response.diet2Summary);
    setRecommendations(response.recommendations);
    setReminders(response.reminders);
    setAudioPreview(response.audioPreview ?? null);
    setShareLink(response.shareLink ?? null);
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
      const message = lastAssistantReply?.content ?? 'Discover my wellness recommendations !';
      const url = shareLink ?? (await shareToWhatsApp(conversationId, message));
      setShareLink(url);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate the sharing link.');
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-page__container">
        <div className="chat-page__left">
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
          <ShareWhatsApp onShare={handleShareWhatsApp} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
