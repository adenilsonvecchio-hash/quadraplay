import React from 'react';
import { Home, Calendar, Plus, Users, User } from 'lucide-react';

export type TabType = 'home' | 'schedule' | 'book' | 'players' | 'profile' | 'matches' | 'admin';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_12px_36px_rgba(11,27,56,0.14)] rounded-[28px] px-3 py-2 flex items-center justify-between pointer-events-auto">
        {/* Início */}
        <button
          id="nav-tab-home"
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all rounded-2xl ${
            activeTab === 'home'
              ? 'text-[#0B1B38] font-black scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'home' ? 'bg-[#1E78E6]/10 text-[#1E78E6]' : ''}`}>
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Início</span>
        </button>

        {/* Agenda */}
        <button
          id="nav-tab-schedule"
          onClick={() => onChangeTab('schedule')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all rounded-2xl ${
            activeTab === 'schedule'
              ? 'text-[#0B1B38] font-black scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'schedule' ? 'bg-[#1E78E6]/10 text-[#1E78E6]' : ''}`}>
            <Calendar className={`w-5 h-5 ${activeTab === 'schedule' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Agenda</span>
        </button>

        {/* Central Prominent Button: Agendar (Modern Dark Squircle with Tennis Ball Lime Glow) */}
        <div className="flex flex-col items-center -mt-6">
          <button
            id="nav-tab-book-center"
            onClick={() => onChangeTab('book')}
            className="w-14 h-14 rounded-2xl bg-[#0B1B38] text-[#D4F63D] flex items-center justify-center shadow-[0_8px_20px_rgba(11,27,56,0.35)] border-4 border-[#EDF4FC] active:scale-95 transition-all hover:bg-[#12284C] group"
            aria-label="Agendar jogo"
          >
            <Plus className="w-6 h-6 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <span className="text-[10px] font-black text-[#0B1B38] mt-0.5">Agendar</span>
        </div>

        {/* Jogadores */}
        <button
          id="nav-tab-players"
          onClick={() => onChangeTab('players')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all rounded-2xl ${
            activeTab === 'players'
              ? 'text-[#0B1B38] font-black scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'players' ? 'bg-[#1E78E6]/10 text-[#1E78E6]' : ''}`}>
            <Users className={`w-5 h-5 ${activeTab === 'players' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Atletas</span>
        </button>

        {/* Perfil */}
        <button
          id="nav-tab-profile"
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all rounded-2xl ${
            activeTab === 'profile'
              ? 'text-[#0B1B38] font-black scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-[#1E78E6]/10 text-[#1E78E6]' : ''}`}>
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

