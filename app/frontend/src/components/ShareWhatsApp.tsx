import React from 'react';

interface ShareWhatsAppProps {
  onShare: () => void;
}

const ShareWhatsApp: React.FC<ShareWhatsAppProps> = ({ onShare }) => {
  return (
    <section className="panel">
      <h2>Share with WhatsApp</h2>
      <button type="button" onClick={onShare}>
        Share to WhatsApp
      </button>
    </section>
  );
};

export default ShareWhatsApp;
