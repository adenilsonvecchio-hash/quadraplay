import React from 'react';
import { Bell, CalendarDays, CalendarPlus, ChevronRight, MapPin, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

interface HomeViewProps {
  onStartBooking: () => void;
  onViewAllMatches: () => void;
  onViewSchedule: () => void;
  onViewPlayers: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartBooking, onViewAllMatches, onViewSchedule, onViewPlayers }) => {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name.split(' ')[0] || 'Jogador';
  const actions = [
    { label: 'Agendar', helper: 'Escolha a quadra e o horário', icon: CalendarPlus, image: undefined, onClick: onStartBooking, tone: 'featured' },
    { label: 'Agenda', helper: 'Horários livres', icon: CalendarDays, image: undefined, onClick: onViewSchedule, tone: 'blue' },
    { label: 'Meus jogos', helper: 'Convites e reservas', icon: undefined, image: './tennis-ball-realistic.png', onClick: onViewAllMatches, tone: 'amber' },
    { label: 'Jogadores', helper: 'Sua classe', icon: Users, image: undefined, onClick: onViewPlayers, tone: 'green' },
  ] as const;

  return (
    <section className="qp-clean-home" aria-label="Início do QuadraPlay">
      <header className="qp-clean-home__header">
        <div className="qp-clean-home__topline">
          <div className="qp-club-mark" aria-label="Tangará Country Clube">T</div>
          <div className="qp-clean-home__title">Início</div>
          <button type="button" className="qp-clean-home__bell" aria-label="Notificações"><Bell size={18} /><span /></button>
        </div>
      </header>

      <div className="qp-clean-home__panel">
        <div className="qp-clean-home__intro">
          <div>
            <BrandLogo className="qp-clean-home__brand" />
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
