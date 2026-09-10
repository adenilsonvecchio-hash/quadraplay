import React from 'react';
interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

/** Identidade visual oficial do SAQUE ON. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false }) => {
  return <div className={`qp-brand-logo ${compact ? 'qp-brand-logo--compact' : ''} ${className}`.trim()} aria-label="SAQUE ON — Tênis">
    <span className="qp-brand-logo__lockup">
      <img className="qp-brand-logo__saque-on" src="./saque-on-logo-v101.png" alt="SAQUE ON" />
    </span>
  </div>;
};
