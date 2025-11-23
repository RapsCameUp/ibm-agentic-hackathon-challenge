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

  const { title, description, calories, highlights = [] } = summary;

  return (
    <section className="panel">
      <h2>{title || 'Diet 2'}</h2>
      <p>{description || 'No description available.'}</p>
      {calories && <div className="panel__meta">~{calories} kcal</div>}
      {highlights && highlights.length > 0 ? (
        <ul className="panel__list">
          {highlights.map((item, index) => (
            <li key={`highlight-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="panel__empty">No key points available.</p>
      )}
    </section>
  );
};

export default DietSummary2;
