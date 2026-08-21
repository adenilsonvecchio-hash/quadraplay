import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin?: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin, activeTab }) => {
  const { currentUser, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#EDF4FC]/90 backdrop-blur-md px-5 pt-4 pb-2 border-b border-white/60">
      <div className="flex items-center justify-between">
        {/* Left Menu / Brand Pill */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm border border-slate-200/80 flex flex-col items-center justify-center gap-1">
            <span className="w-4 h-0.5 bg-[#0B1B38] rounded-full"></span>
            <span className="w-2.5 h-0.5 bg-[#0B1B38] rounded-full self-start ml-3"></span>
            <span className="w-4 h-0.5 bg-[#0B1B38] rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-[#0B1B38]">
                QuadraPlay
              </h1>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#1E78E6]/10 text-[#1E78E6] border border-[#1E78E6]/20">
                Nosso Tênis
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
              Tangará Country Clube
            </p>
          </div>
        </div>

        {/* Right Admin Shortcut & User Avatar Pill */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              id="btn-header-admin"
              onClick={onOpenAdmin}
              className={`text-xs px-2.5 py-1.5 rounded-2xl font-bold flex items-center gap-1 border transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#0B1B38] text-[#D4F63D] border-[#0B1B38] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 shadow-xs'
              }`}
              title="Painel de Administração"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Admin</span>
            </button>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 bg-white/90 p-1 pl-2 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-right">
                <span className="block text-[11px] font-black text-[#0B1B38] leading-tight max-w-[70px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="block text-[9px] font-bold text-[#1E78E6]">
                  Classe {currentUser.tennisClass}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0B1B38] to-[#1E78E6] text-white font-black text-xs flex items-center justify-center shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

