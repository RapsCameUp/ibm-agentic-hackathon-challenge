import React from 'react';
import '../styles/chatpage.css';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  messages: ChatMessage[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <div className="chat-window__empty">Start the conversation !</div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className={`chat-message chat-message--${message.role}`}>
            <div className="chat-message__role">
              {message.role === 'user' ? 'You' : 'Health IA Agent'}
            </div>
            <div className="chat-message__content">{message.content}</div>
            <div className="chat-message__time">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatWindow;
