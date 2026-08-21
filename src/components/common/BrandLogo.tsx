import React from 'react';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

/** Identidade visual oficial do QuadraPlay+. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false }) => (
  <div className={`qp-brand-logo ${compact ? 'qp-brand-logo--compact' : ''} ${className}`.trim()} aria-label="QuadraPlay mais">
    <img className="qp-brand-logo__symbol" src="./quadraplay-symbol.png" alt="" aria-hidden="true" />
    <span className="qp-brand-logo__wordmark">
      <span className="qp-brand-logo__quadra">Quadra</span>
      <strong className="qp-brand-logo__play">Play</strong>
      <b className="qp-brand-logo__plus">+</b>
    </span>
  </div>
);
