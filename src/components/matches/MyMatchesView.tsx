import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Match } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFriendlyDate, formatDayAndMonth } from '../../utils/dateUtils';
import { Calendar, Clock, MapPin, XCircle, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface MyMatchesViewProps {
  onStartBooking: () => void;
}

type SubTab = 'upcoming' | 'past' | 'cancelled';

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({ onStartBooking }) => {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('upcoming');
  const [matches, setMatches] = useState<{
    upcoming: Match[];
    past: Match[];
    cancelled: Match[];
  }>({ upcoming: [], past: [], cancelled: [] });

  const [cancellingMatch, setCancellingMatch] = useState<Match | null>(null);

  const loadMatches = () => {
    if (!currentUser) return;
    const data = storageService.getPlayerMatches(currentUser.id);
    setMatches(data);
  };

  useEffect(() => {
    loadMatches();
    const unsub = storageService.subscribe(loadMatches);
    return unsub;
  }, [currentUser]);

  if (!currentUser) return null;

  const currentList =
    activeSubTab === 'upcoming'
      ? matches.upcoming
      : activeSubTab === 'past'
      ? matches.past
      : matches.cancelled;

  const handleConfirmCancel = (reason?: string) => {
    if (!cancellingMatch) return;
    storageService.cancelMatch(cancellingMatch.id, currentUser.name, reason);
    setCancellingMatch(null);
  };

  const handleRespond = (match: Match, accept: boolean) => {
    storageService.respondToMatch(match.id, currentUser.id, accept);
    loadMatches();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Meus Jogos</h2>
          <p className="text-xs text-slate-500">
            Histórico e agendamentos de {currentUser.name}
          </p>
        </div>
        <button
          id="btn-my-matches-new"
          onClick={onStartBooking}
          className="text-xs font-black bg-[#D4F63D] hover:bg-[#c6ea2f] text-slate-950 px-3 py-2 rounded-xl flex items-center gap-1 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Agendar</span>
        </button>
      </div>

      {/* 3 Tabs: Próximos, Anteriores, Cancelados */}
      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
        <button
          id="tab-sub-upcoming"
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all ${
            activeSubTab === 'upcoming'
              ? 'bg-white text-[#0F1E36] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Próximos ({matches.upcoming.length})
        </button>
        <button
          id="tab-sub-past"
          onClick={() => setActiveSubTab('past')}
          className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all ${
            activeSubTab === 'past'
              ? 'bg-white text-[#0F1E36] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Anteriores ({matches.past.length})
        </button>
        <button
          id="tab-sub-cancelled"
          onClick={() => setActiveSubTab('cancelled')}
          className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all ${
            activeSubTab === 'cancelled'
              ? 'bg-white text-[#0F1E36] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Cancelados ({matches.cancelled.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {activeSubTab === 'upcoming'
                ? 'Nenhum jogo agendado'
                : activeSubTab === 'past'
                ? 'Nenhum jogo anterior registrado'
                : 'Nenhum jogo cancelado'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {activeSubTab === 'upcoming'
                ? 'Você não possui partidas futuras marcadas na quadra.'
                : 'Seus jogos concluídos aparecerão aqui conforme as datas passarem.'}
            </p>
            {activeSubTab === 'upcoming' && (
              <button
                id="btn-empty-booking"
                onClick={onStartBooking}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-[#D4F63D] px-4 py-2.5 rounded-xl hover:bg-[#c6ea2f] transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Agendar agora</span>
              </button>
            )}
          </div>
        ) : (
          currentList.map((match) => {
            const opponentName =
              match.player1Id === currentUser.id ? match.player2Name : match.player1Name;
            const dateParts = formatDayAndMonth(match.date);

            return (
              <div
                key={match.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative overflow-hidden"
              >
                {/* Header status bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                      Classe {match.tennisClass}
                    </span>
                    {activeSubTab === 'upcoming' && (
                      <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${match.status === 'pending' ? 'text-orange-700 bg-orange-50 border-orange-200/60' : 'text-emerald-700 bg-emerald-50 border-emerald-200/60'}`}>
                        {match.status === 'pending' ? (match.player2Id === currentUser.id ? 'Convite recebido' : 'Aguardando confirmação') : 'Confirmado'}
                      </span>
                    )}
                    {activeSubTab === 'past' && (
                      <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Realizado
                      </span>
                    )}
                    {activeSubTab === 'cancelled' && (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 text-[11px]">
                        Cancelado
                      </span>
                    )}
                  </div>

                  {activeSubTab === 'upcoming' && match.status === 'pending' && match.player2Id === currentUser.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleRespond(match, false)} className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg">Recusar</button>
                      <button onClick={() => handleRespond(match, true)} className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg">Aceitar</button>
                    </div>
                  ) : activeSubTab === 'upcoming' ? (
                    <button
                      id={`btn-cancel-match-${match.id}`}
                      onClick={() => setCancellingMatch(match)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  ) : null}
                </div>

                {/* Opponents and details */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0F1E36] font-black text-sm flex flex-col items-center justify-center border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold">{dateParts.weekday}</span>
                      <span className="text-sm font-black">{dateParts.day}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {currentUser.name.split(' ')[0]} vs {opponentName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{match.startTime} às {match.endTime}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{match.courtName}</span>
                  </span>
                  {match.cancelReason && (
                    <span className="text-rose-600 italic">
                      Motivo: {match.cancelReason}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancellation Modal */}
      <ConfirmModal
        isOpen={!!cancellingMatch}
        title="Cancelar agendamento?"
        description={
          cancellingMatch
            ? `Deseja realmente cancelar seu jogo com ${
                cancellingMatch.player1Id === currentUser.id
                  ? cancellingMatch.player2Name
                  : cancellingMatch.player1Name
              } no dia ${formatFriendlyDate(cancellingMatch.date)} às ${cancellingMatch.startTime}?`
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
