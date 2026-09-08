import React from 'react';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

/** Identidade visual oficial do RacharHoje. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false }) => (
  <div className={`qp-brand-logo ${compact ? 'qp-brand-logo--compact' : ''} ${className}`.trim()} aria-label="RacharHoje — Agende seu horário">
    <img className="qp-brand-logo__image" src="./racharhoje-wordmark-v85.png" alt="RacharHoje — Agende seu horário" />
  </div>
);
