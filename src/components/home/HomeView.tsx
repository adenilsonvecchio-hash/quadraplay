import React from 'react';
import { CalendarDays, CalendarPlus, ChevronRight, ListChecks, MapPin, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationsBell } from '../common/NotificationsBell';

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
    { label: 'Jogadores', helper: 'Sua classe', icon: Users, image: undefined, onClick: onViewPlayers, tone: 'green' },
  ] as const;

  return (
    <section className="qp-clean-home" aria-label="Início do QuadraPlay">
      <header className="qp-clean-home__header">
        <div className="qp-clean-home__topline">
          <div className="qp-header-brands">
            <div className="qp-club-mark" aria-label="Tangará Country Clube">
              <img src="./tangara-logo-oficial.png" alt="Tangará" />
            </div>
            <div className="qp-group-mark" aria-label="Grupo Nosso Tênis">
              <img src="./nosso-tenis-logo-v2.png" alt="Nosso Tênis ATT Tour" />
            </div>
          </div>
          <div className="qp-clean-home__title"><span className="qp-header-wordmark"><span>Quadra</span><strong>Play</strong><b>+</b></span></div>
          <NotificationsBell variant="dark" onOpenMatches={onViewAllMatches} />
        </div>
      </header>

      <div className="qp-clean-home__panel">
        <div className="qp-clean-home__intro">
          <div>
            <h1>Olá, {firstName}</h1>
            <p>Organize seu próximo jogo</p>
            <div className="qp-clean-home__club"><MapPin size={12} /> Tangará Country Clube</div>
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
