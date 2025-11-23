import React from 'react';

interface ChatAudioProps {
  audioPreview: string | null;
}

const ChatAudio: React.FC<ChatAudioProps> = ({ audioPreview }) => {
  const handlePlay = () => {
    if (!audioPreview) return;
    const audio = new Audio(`data:audio/mp3;base64,${audioPreview}`);
    void audio.play();
  };

  return (
    <div className="chat-audio">
      <button type="button" onClick={handlePlay} disabled={!audioPreview}>
        ▶️ Listen to the response
      </button>
    </div>
  );
};

export default ChatAudio;
