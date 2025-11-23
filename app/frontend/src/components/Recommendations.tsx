import React from 'react';

interface RecommendationsProps {
  items: string[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ items }) => {
  return (
    <section className="panel">
      <h2>Recommendations</h2>
      {items.length === 0 ? (
        <p className="panel__empty">No recommendations available.</p>
      ) : (
        <ul className="panel__list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Recommendations;
