import React from 'react';
import { CalendarDays, CalendarPlus, ChevronDown, ChevronRight, ListChecks, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationsBell } from '../common/NotificationsBell';
import { Sport } from '../../data/sports';
import { BrandLogo } from '../common/BrandLogo';

interface HomeViewProps {
  onStartBooking: () => void;
  onViewAllMatches: () => void;
  onViewSchedule: () => void;
  onViewPlayers: () => void;
  activeSport: Sport;
  onChangeSport: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartBooking, onViewAllMatches, onViewSchedule, onViewPlayers, activeSport, onChangeSport }) => {
  const { currentUser } = useAuth();
  const firstName = typeof currentUser?.name === 'string' && currentUser.name.trim()
    ? currentUser.name.trim().split(/\s+/)[0]
    : 'Jogador';
  const actions = [
    { label: 'Agendar', helper: 'Escolha a quadra e o horário', icon: CalendarPlus, image: undefined, onClick: onStartBooking, tone: 'featured' },
    { label: 'Horários livres', helper: 'Veja a grade disponível', icon: CalendarDays, image: undefined, onClick: onViewSchedule, tone: 'blue' },
    { label: 'Meus jogos', helper: 'Convites e reservas', icon: ListChecks, image: undefined, onClick: onViewAllMatches, tone: 'amber' },
    { label: 'Participantes', helper: activeSport.id === 'tenis' ? 'Sua classe' : 'Pessoas disponíveis', icon: Users, image: undefined, onClick: onViewPlayers, tone: 'green' },
  ] as const;

  return (
    <section className="qp-clean-home" aria-label="Início do QuadraPlay">
      <header className="qp-clean-home__header">
        <div className="qp-clean-home__topline">
<div className="qp-header-brands" aria-hidden="true" />
          <div className="qp-clean-home__title">
            <BrandLogo className="qp-standard-brand" />
            <span className="qp-multisports-label">AGENDAMENTO DE HORÁRIOS</span>
          </div>
          <NotificationsBell variant="dark" onOpenMatches={onViewAllMatches} />
        </div>
      </header>

      <div className="qp-clean-home__panel">
        <div className="qp-clean-home__intro">
          <div>
            <h1>Olá, {firstName}</h1>
            <p>Organize seu próximo horário</p>
          </div>
          <button type="button" className="qp-active-sport" onClick={onChangeSport} aria-label={`Trocar modalidade. Atual: ${activeSport.name}`}>
            <span>{activeSport.emoji}</span>
            <span><small>Modalidade</small><strong>{activeSport.name}</strong></span>
            <ChevronDown className="qp-active-sport__chevron" size={16} aria-hidden="true" />
          </button>
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
