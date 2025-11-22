import React from 'react';

interface SyncGoogleCalendarProps {
  onSync: () => void;
  synced: boolean;
}

const SyncGoogleCalendar: React.FC<SyncGoogleCalendarProps> = ({ onSync, synced }) => {
  return (
    <section className="panel">
      <h2>Sync Google Calendar</h2>
      <p className="panel__meta">Connect your reminders to Google Calendar.</p>
      <button type="button" onClick={onSync} disabled={synced}>
        {synced ? 'Already synced' : 'Sync Google Calendar'}
      </button>
    </section>
  );
};

export default SyncGoogleCalendar;
