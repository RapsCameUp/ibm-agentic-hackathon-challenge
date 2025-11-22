import React from 'react';

interface RemindersProps {
  reminders: string[];
}

const Reminders: React.FC<RemindersProps> = ({ reminders }) => {
  return (
    <section className="panel">
      <h2>Alerts & Reminders</h2>
      {reminders.length === 0 ? (
        <p className="panel__empty">No reminders configured.</p>
      ) : (
        <ul className="panel__list">
          {reminders.map((reminder) => (
            <li key={reminder}>{reminder}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Reminders;
