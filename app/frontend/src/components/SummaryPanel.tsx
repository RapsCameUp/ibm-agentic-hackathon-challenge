import React from 'react';

interface SummaryPanelProps {
  title: string;
  children: React.ReactNode;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ title, children }) => {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
};

export default SummaryPanel;
