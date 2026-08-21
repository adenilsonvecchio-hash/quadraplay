import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, Clock3, MapPin, Trophy, Users, Gamepad2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Match } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFriendlyDate } from '../../utils/dateUtils';

interface HomeViewProps {
  onStartBooking: () => void;
  onViewAllMatches: () => void;
  onViewSchedule: () => void;
  onViewPlayers: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartBooking, onViewAllMatches, onViewSchedule, onViewPlayers }) => {
  const { currentUser } = useAuth();
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [peerCount, setPeerCount] = useState(0);

  const load = () => {
    if (!currentUser) return;
    setUpcoming(storageService.getPlayerMatches(currentUser.id).upcoming);
    setPeerCount(Math.max(0, storageService.getPlayersByClass(currentUser.tennisClass).length - 1));
  };

  useEffect(() => {
    load();
    return storageService.subscribe(load);
  }, [currentUser]);

  if (!currentUser) return null;
  const firstName = currentUser.name.split(' ')[0];
  const next = upcoming[0];
  const opponent = next ? (next.player1Id === currentUser.id ? next.player2Name : next.player1Name) : null;
  const all = storageService.getPlayerMatches(currentUser.id);
  const played = all.past.length;
  const scheduled = all.upcoming.length;

  return (
    <div className="space-y-4 pb-8">
      <section className="pt-2">
        <h2 className="text-[22px] font-black tracking-tight text-[#0b1742]">Olá, {firstName}!</h2>
        <p className="text-sm text-slate-500 mt-0.5">Pronto para o próximo jogo?</p>
      </section>

      <section className="qp-card rounded-[28px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[.14em] font-black text-slate-400">Próxima partida</p>
            {next ? (
              <>
                <p className="text-xs text-slate-500 font-semibold mt-3">{formatFriendlyDate(next.date)}</p>
                <h3 className="text-[18px] leading-tight font-black mt-1 text-[#0b1742]">{firstName} <span className="text-slate-400">vs</span> {opponent}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{next.startTime} às {next.endTime}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{next.courtName}</span>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-black mt-3">Nenhuma partida marcada</h3>
                <p className="text-xs text-slate-500 mt-1">Escolha uma quadra, horário e adversário.</p>
              </>
            )}
          </div>
          <span className="shrink-0 px-2.5 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-black">CLASSE {currentUser.tennisClass}</span>
        </div>
        <button type="button" onClick={next ? onViewAllMatches : onStartBooking} className="qp-primary w-full mt-4 rounded-[16px] py-3 text-sm font-black">
          {next ? 'Ver detalhes' : 'Agendar partida'}
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h3 className="text-sm font-black text-[#0b1742]">Acesso rápido</h3>
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={onViewSchedule} className="qp-soft rounded-[22px] h-[92px] flex flex-col items-center justify-center gap-2">
            <CalendarDays className="w-5 h-5 text-violet-600" /><span className="text-[10px] font-black">Agenda</span>
          </button>
          <button onClick={onViewPlayers} className="qp-soft rounded-[22px] h-[92px] flex flex-col items-center justify-center gap-2">
            <Users className="w-5 h-5 text-violet-600" /><span className="text-[10px] font-black">Adversários</span>
          </button>
          <button onClick={onViewAllMatches} className="qp-soft rounded-[22px] h-[92px] flex flex-col items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5 text-violet-600" /><span className="text-[10px] font-black">Meus Jogos</span>
          </button>
          <button onClick={onStartBooking} className="qp-soft rounded-[22px] h-[92px] flex flex-col items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-violet-600" /><span className="text-[10px] font-black">Jogar</span>
          </button>
        </div>
      </section>

      <section className="qp-card rounded-[28px] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[.13em] font-black text-slate-400">Seu grupo</p>
            <h3 className="text-base font-black mt-1 text-[#0b1742]">Nosso Tênis</h3>
            <p className="text-xs text-slate-500">{peerCount} adversários na Classe {currentUser.tennisClass}</p>
          </div>
          <div className="w-12 h-12 rounded-[18px] bg-violet-100 text-violet-600 grid place-items-center"><Users className="w-5 h-5" /></div>
        </div>
      </section>

      <section className="qp-card rounded-[28px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black">Resumo</h3>
          <button onClick={onViewAllMatches} className="text-[11px] font-black text-violet-600 flex items-center">Ver jogos <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="text-center"><p className="text-xl font-black text-[#0b1742]">{scheduled}</p><p className="text-[10px] text-slate-400 font-bold">Próximos</p></div>
          <div className="text-center"><p className="text-xl font-black text-[#0b1742]">{played}</p><p className="text-[10px] text-slate-400 font-bold">Realizados</p></div>
          <div className="text-center"><p className="text-xl font-black text-[#0b1742]">{peerCount}</p><p className="text-[10px] text-slate-400 font-bold">Adversários</p></div>
        </div>
      </section>
    </div>
  );
};
