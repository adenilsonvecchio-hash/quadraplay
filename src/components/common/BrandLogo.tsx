import React from 'react';
import { Sport } from '../../data/sports';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  sport?: Sport;
}

/** Identidade visual oficial do RacharHoje. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false, sport }) => (
  <div className={`qp-brand-logo ${compact ? 'qp-brand-logo--compact' : ''} ${className}`.trim()} aria-label="RacharHoje — Agende seu horário">
    <span className="qp-brand-logo__lockup">
      <img className="qp-brand-logo__complete" src="./racharhoje-logo-multiesportes-v92.png" alt="RacharHoje — Agende seu horário" />
      {sport && <span className="qp-brand-logo__sport-badge" title={`Modalidade: ${sport.name}`} aria-label={`Modalidade selecionada: ${sport.name}`}>
        <img src={sport.image} alt="" aria-hidden="true" />
      </span>}
    </span>
  </div>
);
