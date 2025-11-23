import React from 'react';

interface ShareWhatsAppProps {
  onShare: () => void;
  loading?: boolean;
  status?: string | null;
}

const ShareWhatsApp: React.FC<ShareWhatsAppProps> = ({ onShare, loading = false, status }) => {
  return (
    <section className="panel">
      <h2>Share with WhatsApp</h2>
      <button type="button" onClick={onShare} disabled={loading}>
        {loading ? 'Contacting WhatsApp agent…' : 'Share to WhatsApp'}
      </button>
      {status && <p className="panel__status">{status}</p>}
    </section>
  );
};

export default ShareWhatsApp;
