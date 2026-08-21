import React from 'react';

interface HomeViewProps {
  onStartBooking: () => void;
  onViewAllMatches: () => void;
  onViewSchedule: () => void;
  onViewPlayers: () => void;
}

/** Frente oficial aprovada do QuadraPlay, com áreas de navegação funcionais. */
export const HomeView: React.FC<HomeViewProps> = ({ onStartBooking, onViewSchedule }) => (
  <section className="qp-approved-home" aria-label="Início do QuadraPlay">
    <img
      className="qp-approved-home__art"
      src="/quadraplay-home-aprovada.png"
      alt="QuadraPlay, pronto para o próximo jogo"
    />
    <button type="button" className="qp-home-hotspot qp-home-hotspot--booking" onClick={onStartBooking} aria-label="Agendar horário" />
    <button type="button" className="qp-home-hotspot qp-home-hotspot--home" aria-label="Início" />
    <button type="button" className="qp-home-hotspot qp-home-hotspot--schedule" onClick={onViewSchedule} aria-label="Agenda" />
    <button
      type="button"
      className="qp-home-hotspot qp-home-hotspot--profile"
      onClick={() => window.dispatchEvent(new CustomEvent('quadraplay:navigate-profile'))}
      aria-label="Perfil"
    />
  </section>
);
