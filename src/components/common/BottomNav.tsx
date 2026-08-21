import React from 'react';
import { CalendarDays, Home, User } from 'lucide-react';

export type TabType = 'home' | 'schedule' | 'book' | 'players' | 'profile' | 'matches' | 'admin';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const item = (tab: TabType, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onChangeTab(tab)}
      className={`flex flex-col items-center justify-center min-w-[76px] h-[58px] rounded-2xl transition-all ${activeTab === tab ? 'text-[#6855df]' : 'text-[#a7abba]'}`}
    >
      <span className={`grid place-items-center w-9 h-9 rounded-full ${activeTab === tab ? 'bg-[#eeeaff]' : ''}`}>{icon}</span>
      <span className="text-[10px] font-bold mt-0.5">{label}</span>
    </button>
  );

  return (
    <nav className="qp-bottom-nav fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="qp-bottom-nav__inner max-w-md lg:max-w-6xl mx-auto qp-nav pointer-events-auto px-5 lg:px-14 py-2 flex items-center justify-between lg:justify-center lg:gap-24">
        {item('home', 'Início', <Home className="w-[19px] h-[19px]" />)}
        {item('schedule', 'Agenda', <CalendarDays className="w-[19px] h-[19px]" />)}
        {item('profile', 'Perfil', <User className="w-[19px] h-[19px]" />)}
      </div>
    </nav>
  );
};
