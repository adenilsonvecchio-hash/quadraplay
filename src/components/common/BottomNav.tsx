import React from 'react';
import { CalendarDays, Home, Trophy, User } from 'lucide-react';

export type TabType = 'home' | 'schedule' | 'book' | 'players' | 'ranking' | 'profile' | 'matches' | 'admin';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

const TennisMark = () => (
  <svg viewBox="0 0 56 56" className="w-9 h-9" aria-hidden="true">
    <circle cx="28" cy="28" r="23" fill="none" stroke="currentColor" strokeWidth="2.2" opacity=".28" />
    <path d="M18 8c8 8 8 32 0 40M38 8c-8 8-8 32 0 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const item = (tab: TabType, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onChangeTab(tab)}
      className={`flex flex-col items-center justify-center w-[58px] h-[54px] rounded-2xl transition-all ${activeTab === tab ? 'text-[#5636ff]' : 'text-[#0b1742]'}`}
    >
      <span className={`grid place-items-center w-8 h-8 rounded-xl ${activeTab === tab ? 'bg-violet-100 shadow-[0_5px_14px_rgba(91,55,255,.16)]' : ''}`}>{icon}</span>
      <span className="text-[10px] font-bold mt-0.5">{label}</span>
    </button>
  );

  return (
    <nav className="fixed bottom-2 left-0 right-0 z-50 px-3 pointer-events-none">
      <div className="max-w-md mx-auto qp-nav pointer-events-auto px-2 py-2 flex items-center justify-between">
        {item('home', 'Início', <Home className="w-[19px] h-[19px]" />)}
        {item('schedule', 'Agenda', <CalendarDays className="w-[19px] h-[19px]" />)}

        <div className="relative w-[72px] h-[54px] flex justify-center">
          <button
            type="button"
            onClick={() => onChangeTab('book')}
            className="absolute -top-7 w-[66px] h-[66px] rounded-full bg-gradient-to-br from-[#765cff] via-[#5d39ff] to-[#4224dc] text-white grid place-items-center border-[5px] border-[#f8f9ff] shadow-[0_10px_28px_rgba(88,51,255,.42),inset_0_2px_0_rgba(255,255,255,.55)] active:scale-95 transition-transform"
            aria-label="Jogar"
          >
            <TennisMark />
          </button>
          <span className="absolute top-[39px] text-[10px] font-black text-[#4e2cff]">JOGAR</span>
        </div>

        {item('ranking', 'Ranking', <Trophy className="w-[19px] h-[19px]" />)}
        {item('profile', 'Perfil', <User className="w-[19px] h-[19px]" />)}
      </div>
    </nav>
  );
};
