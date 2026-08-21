import React, { useState } from 'react';
import { Bell, CalendarDays, Home, ListChecks, Menu, ShieldCheck, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMatchNotifications } from '../../hooks/useMatchNotifications';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onOpenAdmin?: () => void;
  activeTab: string;
  onNavigate?: (tab: 'home' | 'schedule' | 'games' | 'profile' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin, activeTab, onNavigate }) => {
  const { isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount } = useMatchNotifications();
  const navigate = (tab: 'home' | 'schedule' | 'games' | 'profile' | 'admin') => {
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

        <BrandLogo compact className="justify-self-center" />

        <div className="relative">
          <button
            type="button"
            onClick={() => { setNotificationsOpen((open) => !open); setMenuOpen(false); }}
            className="qp-icon-btn w-12 h-12"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
          </button>
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#6038ff] text-white text-[10px] font-black grid place-items-center shadow-md">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </div>
      </div>
      {notificationsOpen && <div className="absolute right-4 top-[74px] z-50 w-[min(350px,calc(100vw-32px))] rounded-[24px] border border-white bg-white/95 p-3 shadow-[0_18px_48px_rgba(40,45,90,0.18)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-1 pb-2"><h3 className="text-sm font-black text-[#101b3d]">Notificações</h3><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Fechar notificações"><X className="w-4 h-4 text-slate-400" /></button></div>
        {notifications.length === 0 ? <div className="rounded-[17px] bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">Nenhuma notificação.</div> : <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">{notifications.slice(0, 8).map((item) => <button key={`${item.id}-${item.title}`} type="button" onClick={() => { navigate('games'); setNotificationsOpen(false); }} className="w-full rounded-[17px] bg-slate-50 p-3 text-left flex gap-2.5"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.unread ? 'bg-violet-600' : 'bg-slate-300'}`} /><span className="min-w-0"><span className="block text-xs font-black text-slate-800 truncate">{item.title}</span><span className="block mt-1 text-[10px] font-semibold text-slate-500">{item.detail}</span></span></button>)}</div>}
      </div>}
      {menuOpen && (
        <nav className="absolute left-4 top-[74px] z-50 w-[min(320px,calc(100vw-32px))] rounded-[24px] border border-white bg-white/95 p-2 shadow-[0_18px_48px_rgba(40,45,90,0.18)] backdrop-blur-xl">
          {[
            { tab: 'home' as const, label: 'Início', icon: Home },
            { tab: 'schedule' as const, label: 'Agenda', icon: CalendarDays },
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
        </nav>
      )}
    </header>
  );
};
