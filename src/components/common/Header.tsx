import React from 'react';
import { Bell, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenAdmin?: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin, activeTab }) => {
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 pb-3 bg-[#f8f9ff]/88 backdrop-blur-xl">
      <div className="grid grid-cols-[48px_1fr_48px] items-center gap-3">
        <button
          type="button"
          className="qp-icon-btn w-12 h-12"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        <div className="text-center select-none leading-none">
          <span className="text-[27px] font-black tracking-[-1.5px] text-[#0b1742]">Quadra</span>
          <span className="text-[27px] font-black italic tracking-[-1.7px] text-[#5b37ff]">Play</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={isAdmin ? onOpenAdmin : undefined}
            className={`qp-icon-btn w-12 h-12 ${activeTab === 'admin' ? 'ring-2 ring-violet-300' : ''}`}
            aria-label={isAdmin ? 'Notificações e administração' : 'Notificações'}
          >
            {isAdmin && activeTab === 'admin' ? <ShieldCheck className="w-5 h-5 text-violet-600" /> : <Bell className="w-5 h-5" />}
          </button>
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#6038ff] text-white text-[10px] font-black grid place-items-center shadow-md">2</span>
        </div>
      </div>
    </header>
  );
};
