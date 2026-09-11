import React from 'react';
import { CalendarDays, CalendarPlus, ChevronRight, ListChecks, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationsBell } from '../common/NotificationsBell';
import { BrandLogo } from '../common/BrandLogo';

interface HomeViewProps {
  onStartBooking: () => void;
  onViewAllMatches: () => void;
  onViewSchedule: () => void;
  onViewPlayers: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartBooking, onViewAllMatches, onViewSchedule, onViewPlayers }) => {
  const { currentUser } = useAuth();
  const firstName = typeof currentUser?.name === 'string' && currentUser.name.trim()
    ? currentUser.name.trim().split(/\s+/)[0]
    : 'Jogador';
  const actions = [
    { label: 'Agendar', helper: 'Escolha a quadra e o horário', icon: CalendarPlus, image: undefined, onClick: onStartBooking, tone: 'featured' },
    { label: 'Horários livres', helper: 'Veja a grade disponível', icon: CalendarDays, image: undefined, onClick: onViewSchedule, tone: 'blue' },
    { label: 'Meus jogos', helper: 'Convites e reservas', icon: ListChecks, image: undefined, onClick: onViewAllMatches, tone: 'amber' },
    { label: 'Jogadores', helper: 'Encontre por nome ou classe', icon: Users, image: undefined, onClick: onViewPlayers, tone: 'green' },
  ] as const;

  return (
    <section className="qp-clean-home" aria-label="Início do SAQUE ON">
      <header className="qp-clean-home__header">
        <div className="qp-clean-home__topline">
<div className="qp-header-brands" aria-hidden="true" />
          <div className="qp-clean-home__title">
            <BrandLogo className="qp-standard-brand" />
            <span className="qp-tennis-label">AGENDAMENTO DE HORÁRIO</span>
          </div>
          <NotificationsBell variant="dark" onOpenMatches={onViewAllMatches} />
        </div>
      </header>

      <div className="qp-clean-home__panel">
        <div className="qp-clean-home__intro">
          <div>
            <div className="qp-friendly-greeting">
              <h1>Olá, {firstName}! <span>Vamos jogar?</span></h1>
              <img className="qp-friendly-greeting__racket" src="./raquete-tenis-realista-v99.png" alt="" aria-hidden="true" />
            </div>
            <p>Seu próximo jogo começa aqui.</p>
          </div>
        </div>
        <div className="qp-action-grid">
          {actions.map(({ label, helper, icon: Icon, image, onClick, tone }) => (
            <button type="button" key={label} onClick={onClick} className={`qp-action-card qp-action-card--${tone}`}>
              <span className={`qp-action-card__icon qp-action-card__icon--${tone}`}>
                {image ? <img className="qp-action-card__photo-icon" src={image} alt="" aria-hidden="true" /> : Icon ? <Icon size={25} strokeWidth={1.8} /> : null}
              </span>
              <strong>{label}</strong><small>{helper}</small><ChevronRight className="qp-action-card__arrow" size={16} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
