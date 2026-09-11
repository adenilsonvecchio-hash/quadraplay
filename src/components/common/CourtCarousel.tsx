import React, { useEffect, useMemo, useState } from 'react';

// Fotos de quadras/tênis usadas no carrossel decorativo do início. Ficam em
// ordem embaralhada a cada carregamento e trocam sozinhas, uma esmaecendo
// enquanto a próxima aparece — sem caixa/moldura, as bordas se dissolvem em
// transparência.
const COURT_IMAGES = [
  './courts/saibro-bola-raquete.png',
  './courts/quadra-saibro-coberta.png',
  './courts/quadra-verde-cerca.png',
  './courts/bola-linha-saibro.png',
  './courts/bolinhas-tenis.png',
  './courts/bola-conceito.png',
  './courts/quadra-azul-montanha.png',
];

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface CourtCarouselProps {
  className?: string;
  /** Intervalo entre trocas, em ms. */
  intervalMs?: number;
}

export const CourtCarousel: React.FC<CourtCarouselProps> = ({ className, intervalMs = 3200 }) => {
  // Embaralha só uma vez, quando o componente monta — assim a ordem muda a
  // cada visita/recarregamento da tela, mas não fica reordenando sozinha.
  const order = useMemo(() => shuffle(COURT_IMAGES), []);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (order.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % order.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [order.length, intervalMs]);

  return (
    <div className={`qp-court-carousel ${className || ''}`} aria-hidden="true">
      {order.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`qp-court-slide ${i === activeIndex ? 'is-active' : ''}`}
          loading="lazy"
        />
      ))}
    </div>
  );
};
