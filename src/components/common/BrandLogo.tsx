import React from 'react';
import { Sport } from '../../data/sports';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  sport?: Sport;
}

/** Identidade visual oficial do JogarHoje. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false, sport }) => {
  const words = sport?.name.trim().split(/\s+/) || [];
  const accentWord = words.length > 1 ? words[words.length - 1] : '';
  const mainWords = words.length > 1 ? words.slice(0, -1).join(' ') : words.join(' ');
  return <div className={`qp-brand-logo ${compact ? 'qp-brand-logo--compact' : ''} ${sport ? 'qp-brand-logo--sport' : ''} ${className}`.trim()} aria-label={sport ? `${sport.name} — Agende seu horário` : 'JogarHoje — Agende seu horário'}>
    <span className="qp-brand-logo__lockup">
      {sport ? <>
        <span className="qp-brand-logo__sport-replacement" title={`Modalidade: ${sport.name}`} aria-label={`Modalidade selecionada: ${sport.name}`}>
          <img src={sport.image} alt="" aria-hidden="true" />
        </span>
        <span className="qp-brand-logo__sport-wordmark">
          <strong><span>{mainWords}</span>{accentWord && <> <em>{accentWord}</em></>}</strong>
          <small>Agende seu horário</small>
        </span>
      </> : <>
        <span className="qp-brand-logo__mascot-crop" aria-hidden="true">
          <img src="./racharhoje-logo-multiesportes-v92.png" alt="" />
        </span>
        <span className="qp-brand-logo__jogar-wordmark">
          <strong><span>Jogar</span><em>Hoje</em></strong>
          <small>Agende seu horário</small>
        </span>
      </>}
    </span>
  </div>;
};
