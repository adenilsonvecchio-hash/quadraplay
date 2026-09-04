import React, { useState } from 'react';
import { CalendarDays, Home, ListChecks, Menu, ShieldCheck, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { NotificationsBell } from './NotificationsBell';
import { TabType } from './BottomNav';
import { Sport } from '../../data/sports';
import { SportSymbol } from './SportSymbol';

interface HeaderProps {
  onOpenAdmin?: () => void;
  activeTab: string;
  onNavigate?: (tab: TabType) => void;
  activeSport: Sport;
  onChangeSport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin, activeTab, onNavigate, activeSport, onChangeSport }) => {
  const { isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (tab: TabType) => {
    onNavigate?.(tab);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 px-4 pt-4 pb-3 bg-[#f8f9ff]/95 backdrop-blur-xl">
      <div className="grid grid-cols-[48px_1fr_48px] items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="qp-icon-btn w-12 h-12"
          aria-label="Abrir menu"
        >
          {menuOpen ? <X className="w-6 h-6 stroke-[2.2]" /> : <Menu className="w-6 h-6 stroke-[2.2]" />}
        </button>

        <div className="justify-self-center qp-global-brand-stack">
          <BrandLogo className="qp-standard-brand" />
          <SportSymbol sport={activeSport} />
        </div>

        <div className="relative"><NotificationsBell onOpenMatches={() => navigate('matches')} /></div>
      </div>
      {menuOpen && (
        <nav className="absolute left-4 top-[74px] z-50 w-[min(320px,calc(100vw-32px))] rounded-[24px] border border-white bg-white/95 p-2 shadow-[0_18px_48px_rgba(40,45,90,0.18)] backdrop-blur-xl">
          {[
            { tab: 'home' as const, label: 'Início', icon: Home },
            { tab: 'schedule' as const, label: 'Horários livres', icon: CalendarDays },
            { tab: 'games' as const, label: 'Jogos agendados', icon: ListChecks },
            { tab: 'profile' as const, label: 'Perfil', icon: User },
          ].map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => navigate(tab)} className={`w-full flex items-center gap-3 rounded-[17px] px-3 py-3 text-left text-sm font-black ${activeTab === tab ? 'bg-violet-100 text-violet-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
          {isAdmin && (
            <button type="button" onClick={() => navigate('admin')} className={`w-full flex items-center gap-3 rounded-[17px] px-3 py-3 text-left text-sm font-black ${activeTab === 'admin' ? 'bg-amber-100 text-amber-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              <ShieldCheck className="w-5 h-5" /> Painel administrativo
            </button>
          )}
          <button type="button" onClick={() => { setMenuOpen(false); onChangeSport(); }} className="w-full flex items-center gap-3 rounded-[17px] px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-50">
            <span className="text-xl" aria-hidden="true">{activeSport.emoji}</span> Trocar esporte
          </button>
        </nav>
      )}
    </header>
  );
};
