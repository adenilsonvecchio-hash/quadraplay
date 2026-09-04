import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SPORTS, SportId } from '../../data/sports';
import { BrandLogo } from '../common/BrandLogo';
import { SportSymbol } from '../common/SportSymbol';

interface SportSelectionViewProps {
  userName?: string;
  onSelect: (sportId: SportId) => void;
}

export const SportSelectionView: React.FC<SportSelectionViewProps> = ({ userName, onSelect }) => {
  const firstName = userName?.trim().split(/\s+/)[0] || 'Jogador';
  return (
    <section className="qp-sport-picker" aria-label="Escolha sua modalidade">
      <header className="qp-sport-picker__header">
        <BrandLogo className="qp-standard-brand" />
        <p>Olá, <strong>{firstName}</strong></p>
        <h1>Escolha seu esporte</h1>
        <small>Você poderá trocar de modalidade quando quiser.</small>
      </header>
      <div className="qp-sport-picker__grid">
        {SPORTS.map((sport) => (
          <button key={sport.id} type="button" onClick={() => onSelect(sport.id)} className="qp-sport-card" style={{ '--sport-color': sport.color } as React.CSSProperties}>
            <SportSymbol sport={sport} size="card" />
            <strong>{sport.name}</strong>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
    </section>
  );
};
