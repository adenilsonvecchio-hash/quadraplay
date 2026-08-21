import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Match } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFriendlyDate, formatDayAndMonth } from '../../utils/dateUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  AlertCircle,
  ChevronRight,
  XCircle,
  MoreHorizontal,
  ChevronUp,
  Award,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface HomeViewProps {
  onStartBooking: () => void;
  onViewAllMatches: () => void;
  onViewSchedule: () => void;
  onViewPlayers: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartBooking,
  onViewAllMatches,
  onViewSchedule,
  onViewPlayers,
}) => {
  const { currentUser } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [cancellingMatch, setCancellingMatch] = useState<Match | null>(null);
  const [classPeersCount, setClassPeersCount] = useState<number>(9);

  const loadData = () => {
    if (!currentUser) return;
    const { upcoming } = storageService.getPlayerMatches(currentUser.id);
    setUpcomingMatches(upcoming);

    const peers = storageService.getPlayersByClass(currentUser.tennisClass);
    setClassPeersCount(peers.length - 1); // exclude self
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return unsub;
  }, [currentUser]);

  if (!currentUser) return null;

  const firstName = currentUser.name.split(' ')[0];
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;

  const handleConfirmCancel = (reason?: string) => {
    if (!cancellingMatch) return;
    storageService.cancelMatch(cancellingMatch.id, currentUser.name, reason);
    setCancellingMatch(null);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 1. TOP CAROUSEL: Modern Athlete Pass Cards (Styled like the Blue/Navy Cards in reference) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
        {/* Quick Add Card (Pill card on the left like in screenshot) */}
        <button
          id="btn-quick-add-card"
          onClick={onStartBooking}
          className="w-14 h-48 rounded-[28px] bg-[#0B1B38] text-white flex flex-col items-center justify-center gap-2 shrink-0 shadow-md shadow-slate-900/10 hover:bg-[#12284C] transition-all group"
          title="Novo Agendamento"
        >
          <div className="w-8 h-8 rounded-full bg-[#1E78E6]/20 border border-[#1E78E6]/40 flex items-center justify-center text-[#D4F63D] group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-[10px] font-black tracking-tighter text-slate-300 rotate-180 [writing-mode:vertical-rl]">
            AGENDAR
          </span>
        </button>

        {/* Main Blue Athlete Card (MasterCard / Visa aesthetic with tennis geometry) */}
        <div className="w-64 h-48 rounded-[28px] bg-gradient-to-br from-[#1F7BEA] via-[#166BD4] to-[#0D4DAE] p-4 text-white shrink-0 relative overflow-hidden shadow-[0_12px_28px_rgba(22,107,212,0.28)] flex flex-col justify-between border border-white/20">
          {/* Subtle concentric rings/watermark arcs like the reference */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full border-[1.5px] border-white/15 pointer-events-none" />
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full border-[1.5px] border-white/20 pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full border-[1.5px] border-white/10 pointer-events-none" />

          {/* Top of Card */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/30">
              <span className="w-2 h-2 rounded-full bg-[#D4F63D]"></span>
              <span className="text-[10px] font-extrabold tracking-wide uppercase">
                Classe {currentUser.tennisClass}
              </span>
            </div>

            {/* Twin Overlapping Rings Logo (Visa/Mastercard vibe) */}
            <div className="flex items-center -space-x-2 opacity-90">
              <div className="w-6 h-6 rounded-full bg-[#D4F63D]/80 mix-blend-screen" />
              <div className="w-6 h-6 rounded-full bg-white/60 mix-blend-screen" />
            </div>
          </div>

          {/* Middle: Club & Status */}
          <div className="relative z-10 my-auto">
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-100/80">
              Nosso Tênis • Tangará
            </p>
            <h3 className="text-lg font-black text-white tracking-tight leading-tight mt-0.5">
              {currentUser.name}
            </h3>
            <p className="text-[11px] font-semibold text-blue-100 flex items-center gap-1 mt-0.5">
              <span>Quadra Central (Saibro)</span>
            </p>
          </div>

          {/* Bottom of Card */}
          <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/15 text-[10px]">
            <div>
              <span className="text-blue-200/80 font-medium block">Adversários na Classe</span>
              <span className="font-extrabold text-white text-xs">{classPeersCount} atletas disponíveis</span>
            </div>

            <div className="text-right">
              <span className="text-blue-200/80 font-medium block">Status</span>
              <span className="font-extrabold text-[#D4F63D] text-xs">Ativo</span>
            </div>
          </div>
        </div>

        {/* Second Card: Next Game Preview / Mini Card */}
        <div className="w-56 h-48 rounded-[28px] bg-gradient-to-br from-[#0B1B38] via-[#0E2347] to-[#08152B] p-4 text-white shrink-0 relative overflow-hidden shadow-lg border border-slate-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Próxima Partida
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {nextMatch ? (
            <div className="my-auto">
              <span className="text-[10px] font-bold text-[#D4F63D] uppercase tracking-wider">
                {formatFriendlyDate(nextMatch.date)}
              </span>
              <h4 className="text-sm font-black text-white truncate mt-0.5">
                vs {nextMatch.player1Id === currentUser.id ? nextMatch.player2Name : nextMatch.player1Name}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D4F63D]" />
                <span>{nextMatch.startTime} às {nextMatch.endTime}</span>
              </p>
            </div>
          ) : (
            <div className="my-auto">
              <p className="text-xs font-bold text-slate-300">Nenhum jogo marcado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Desafie um colega da Classe {currentUser.tennisClass}.
              </p>
            </div>
          )}

          <button
            onClick={onStartBooking}
            className="w-full py-2 bg-[#D4F63D] hover:bg-[#c6ea2f] text-slate-950 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all"
          >
            <span>{nextMatch ? 'Novo Agendamento' : 'Marcar Agora'}</span>
            <ChevronRight className="w-3 h-3 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 2. ACTIVITIES / AÇÕES RÁPIDAS (Matching the 4 round navy squircle buttons in screenshot) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black text-[#0B1B38] tracking-tight">
            Atividades Rápidas
          </h3>
          <button
            onClick={onViewAllMatches}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Mais opções"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Navy Squircle Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* Button 1: Agendar */}
          <button
            id="btn-activity-book"
            onClick={onStartBooking}
            className="flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-[22px] bg-[#0B1B38] text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-[#12284C] group-hover:scale-105 transition-all">
              <div className="w-7 h-7 rounded-full bg-[#1E78E6]/20 flex items-center justify-center text-[#D4F63D]">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0B1B38] mt-2 tracking-tight">
              Agendar
            </span>
          </button>

          {/* Button 2: Agenda da Quadra */}
          <button
            id="btn-activity-schedule"
            onClick={onViewSchedule}
            className="flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-[22px] bg-[#0B1B38] text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-[#12284C] group-hover:scale-105 transition-all">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Calendar className="w-4 h-4 stroke-2" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0B1B38] mt-2 tracking-tight">
              Agenda
            </span>
          </button>

          {/* Button 3: Adversários */}
          <button
            id="btn-activity-players"
            onClick={onViewPlayers}
            className="flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-[22px] bg-[#0B1B38] text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-[#12284C] group-hover:scale-105 transition-all">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Users className="w-4 h-4 stroke-2" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0B1B38] mt-2 tracking-tight">
              Adversários
            </span>
          </button>

          {/* Button 4: Meus Jogos */}
          <button
            id="btn-activity-matches"
            onClick={onViewAllMatches}
            className="flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-[22px] bg-[#0B1B38] text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-[#12284C] group-hover:scale-105 transition-all">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#D4F63D]">
                <Trophy className="w-4 h-4 stroke-2" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0B1B38] mt-2 tracking-tight">
              Meus Jogos
            </span>
          </button>
        </div>
      </div>

      {/* 3. TRANSACTIONS / JOGOS DRAWER (Deep Navy Curved Container at Bottom like reference) */}
      <div className="bg-[#0B1B38] text-white rounded-t-[36px] -mx-4 px-5 pt-3 pb-8 shadow-2xl relative border-t border-slate-700/50 mt-2">
        {/* Curved Chevron Handle */}
        <div className="flex justify-center -mt-1 mb-2">
          <div className="w-8 h-5 flex items-center justify-center text-slate-400">
            <ChevronUp className="w-4 h-4" />
          </div>
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white tracking-tight">
              Jogos & Agendamentos
            </h3>
            {upcomingMatches.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#1E78E6] text-white text-[10px] font-extrabold">
                {upcomingMatches.length}
              </span>
            )}
          </div>

          <button
            id="btn-drawer-all-matches"
            onClick={onViewAllMatches}
            className="text-xs font-bold text-[#D4F63D] hover:underline"
          >
            Ver todos
          </button>
        </div>

        {/* Drawer Matches List */}
        <div className="space-y-3">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.slice(0, 4).map((match) => {
              const opponentName =
                match.player1Id === currentUser.id ? match.player2Name : match.player1Name;
              const dateParts = formatDayAndMonth(match.date);

              return (
                <div
                  key={match.id}
                  className="bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Circular Ocean Blue Icon Pill (like Flight/Shopping in reference) */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E78E6] to-[#0D4EA8] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      🎾
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-white leading-tight">
                          vs {opponentName}
                        </h4>
                        <span className="text-[9px] font-black bg-[#D4F63D] text-slate-950 px-1.5 py-0.2 rounded">
                          Cl. {match.tennisClass}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dateParts.weekday}, {dateParts.day} • {match.startTime}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Status / Action */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Confirmado
                    </span>
                    <button
                      id={`btn-drawer-cancel-${match.id}`}
                      onClick={() => setCancellingMatch(match)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-white/10 flex items-center justify-center text-slate-300 mb-2">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">Nenhum jogo agendado</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Desafie os colegas da sua Classe {currentUser.tennisClass} na Quadra Central.
              </p>
              <button
                id="btn-drawer-empty-book"
                onClick={onStartBooking}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-[#D4F63D] px-4 py-2 rounded-xl hover:bg-[#c6ea2f] transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Agendar agora</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Cancellation Modal */}
      <ConfirmModal
        isOpen={!!cancellingMatch}
        title="Cancelar agendamento?"
        description={
          cancellingMatch
            ? `Tem certeza que deseja cancelar o jogo contra ${
                cancellingMatch.player1Id === currentUser.id
                  ? cancellingMatch.player2Name
                  : cancellingMatch.player1Name
              } em ${formatFriendlyDate(cancellingMatch.date)} às ${cancellingMatch.startTime}? O horário será liberado para outros atletas imediatamente.`
            : ''
        }
        confirmLabel="Sim, Cancelar Jogo"
        cancelLabel="Manter Jogo"
        isDestructive={true}
        showReasonInput={true}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancellingMatch(null)}
      />
    </div>
  );
};

