import React from 'react';
import { Sport } from '../../data/sports';

interface SportSymbolProps {
  sport: Sport;
  size?: 'header' | 'card';
}

export const SportSymbol: React.FC<SportSymbolProps> = ({ sport, size = 'header' }) => (
  <span
    className={`qp-sport-symbol qp-sport-symbol--${size}`}
    style={{ '--sport-color': sport.color } as React.CSSProperties}
    role="img"
    aria-label={sport.name}
  >
    {'image' in sport && sport.image
      ? <img src={sport.image} alt="" aria-hidden="true" />
      : <span aria-hidden="true">{sport.emoji}</span>}
  </span>
);
