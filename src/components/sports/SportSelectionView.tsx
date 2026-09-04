import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SPORTS, SportId } from '../../data/sports';

interface SportSelectionViewProps {
  userName?: string;
  onSelect: (sportId: SportId) => void;
}

export const SportSelectionView: React.FC<SportSelectionViewProps> = ({ userName, onSelect }) => {
  const firstName = userName?.trim().split(/\s+/)[0] || 'Jogador';
  return (
    <section className="qp-sport-picker" aria-label="Escolha sua modalidade">
      <header className="qp-sport-picker__header">
        <span className="qp-header-wordmark"><span>Quadra</span><strong>Play</strong><b>+</b></span>
        <p>Olá, {firstName}</p>
        <h1>Escolha seu esporte</h1>
        <small>Você poderá trocar de modalidade quando quiser.</small>
      </header>
      <div className="qp-sport-picker__grid">
        {SPORTS.map((sport) => (
          <button key={sport.id} type="button" onClick={() => onSelect(sport.id)} className="qp-sport-card" style={{ '--sport-color': sport.color } as React.CSSProperties}>
            <span className="qp-sport-card__emoji" aria-hidden="true">{sport.emoji}</span>
            <strong>{sport.name}</strong>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
    </section>
  );
};
