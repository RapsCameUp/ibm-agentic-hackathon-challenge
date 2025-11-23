import React from 'react';
import type { DietSummary } from '../services/chat.api';

interface DietSummary2Props {
  summary: DietSummary | null;
}

const DietSummary2: React.FC<DietSummary2Props> = ({ summary }) => {
  if (!summary) {
    return (
      <section className="panel">
        <h2>Diet 2</h2>
        <p className="panel__empty">No summary available.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{summary.title}</h2>
      <p>{summary.description}</p>
      <div className="panel__meta">~{summary.calories} kcal</div>
      <ul className="panel__list">
        {summary.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
};

export default DietSummary2;
