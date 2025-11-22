import React from 'react';
import type { DietSummary } from '../services/chat.api';

interface DietSummary1Props {
  summary: DietSummary | null;
}

const DietSummary1: React.FC<DietSummary1Props> = ({ summary }) => {
  if (!summary) {
    return (
      <section className="panel">
        <h2>Diet 1</h2>
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

export default DietSummary1;
