import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Plus, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Match } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { formatFriendlyDate, getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';
import { ConfirmModal } from '../common/ConfirmModal';

interface MyMatchesViewProps { onStartBooking: () => void; }
type SubTab = 'upcoming' | 'past' | 'cancelled';

const safeText = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;
const safeDate = (value: unknown) => {
  if (typeof value !== 'string') return 'Data não informada';
  try { return formatFriendlyDate(value); } catch { return value; }
};

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({ onStartBooking }) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [activeTab, setActiveTab] = useState<SubTab>('upcoming');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Match | null>(null);

  const loadMatches = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const result = usingSupabase && groupId
        ? await supabaseAgendaService.getMatchesForUser(groupId, currentUser.id)
        : storageService.getMatches();
      const mine = (Array.isArray(result) ? result : []).filter((match): match is Match =>
        !!match && (match.player1Id === currentUser.id || match.player2Id === currentUser.id),
      );
      setMatches(mine);
      setError('');
    } catch (loadError) {
      console.warn('Não foi possível carregar Meus jogos.', loadError);
      setMatches([]);
      setError('Não foi possível carregar seus jogos do banco.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, groupId, usingSupabase]);

  useEffect(() => {
    void loadMatches();
    let unsubscribe = () => undefined;
    try {
      unsubscribe = usingSupabase && groupId
        ? supabaseAgendaService.subscribeToMatches(groupId, () => void loadMatches())
        : storageService.subscribe(() => void loadMatches());
    } catch (subscriptionError) {
      console.warn('Atualização em tempo real de Meus jogos indisponível.', subscriptionError);
    }
    return () => { unsubscribe(); };
  }, [groupId, loadMatches, usingSupabase]);

  const buckets = useMemo(() => {
    const today = getBrasiliaToday();
    const result: Record<SubTab, Match[]> = { upcoming: [], past: [], cancelled: [] };
    matches.forEach((match) => {
      if (match.status === 'cancelled') result.cancelled.push(match);
      else if (match.status === 'completed' || match.date < today || isSlotInPast(match.date, match.startTime)) result.past.push(match);
      else result.upcoming.push(match);
    });
    result.upcoming.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
    result.past.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
    result.cancelled.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
    return result;
  }, [matches]);

  if (!currentUser) return null;
  const visibleMatches = buckets[activeTab] || [];

  const respond = async (match: Match, accept: boolean) => {
    setBusyId(match.id); setError('');
    try {
      if (usingSupabase) await supabaseAgendaService.respondToMatch(match.id, currentUser.id, accept);
      else {
        const result = storageService.respondToMatch(match.id, currentUser.id, accept);
        if (!result.success) throw new Error(result.error);
      }
      await loadMatches();
    } catch {
      setError('Não foi possível responder ao convite.');
    } finally { setBusyId(null); }
  };

  const confirmCancellation = async (reason?: string) => {
    if (!cancelling) return;
    setBusyId(cancelling.id); setError('');
    try {
      if (usingSupabase) await supabaseAgendaService.cancelMatch(cancelling.id, currentUser.id, reason);
      else {
        const result = storageService.cancelMatch(cancelling.id, currentUser.name, reason);
        if (!result.success) throw new Error(result.error);
      }
      setCancelling(null);
      await loadMatches();
    } catch {
      setError('Não foi possível cancelar a partida.');
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-end justify-between gap-3 pt-1">
        <div><h2 className="text-2xl font-black tracking-tight">Meus Jogos</h2><p className="text-xs text-slate-500 mt-1">Convites, partidas confirmadas e histórico.</p></div>
        <button type="button" onClick={onStartBooking} className="qp-primary rounded-[16px] px-3 py-2.5 text-xs font-black flex items-center gap-1"><Plus className="w-4 h-4"/>Novo</button>
      </div>

      <div className="qp-card rounded-[22px] p-1.5 grid grid-cols-3 gap-1">
        {([['upcoming', 'Próximos'], ['past', 'Histórico'], ['cancelled', 'Cancelados']] as const).map(([key, label]) => (
          <button type="button" key={key} onClick={() => setActiveTab(key)} className={`rounded-[16px] py-2.5 text-xs font-black transition ${activeTab === key ? 'qp-primary' : 'text-slate-500'}`}>{label}</button>
        ))}
      </div>

      {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">{error}</div>}
      {loading && <div className="qp-card rounded-[28px] p-8 text-center text-sm font-bold text-slate-500">Carregando seus jogos...</div>}
      {!loading && visibleMatches.length === 0 && <div className="qp-card rounded-[28px] p-8 text-center"><CalendarDays className="w-8 h-8 text-violet-400 mx-auto"/><h3 className="font-black mt-3">Nenhum jogo nesta seção</h3><p className="text-xs text-slate-500 mt-1">Quando houver movimentações, elas aparecerão aqui.</p></div>}

      <div className="space-y-3">
        {!loading && visibleMatches.map((match) => {
          const opponent = match.player1Id === currentUser.id ? match.player2Name : match.player1Name;
          const incoming = match.status === 'pending' && match.player2Id === currentUser.id;
          const outgoing = match.status === 'pending' && match.player1Id === currentUser.id;
          const statusLabel = incoming ? 'Convite recebido' : outgoing ? 'Aguardando adversário' : match.status === 'cancelled' ? (match.cancelReason === 'Convite recusado pelo adversário' ? 'Convite recusado' : 'Cancelado') : activeTab === 'past' ? 'Realizado' : 'Confirmado';
          return (
            <article key={safeText(match.id, `${match.date}-${match.startTime}`)} className="qp-card rounded-[26px] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${match.status === 'pending' ? 'bg-orange-50 text-orange-700' : match.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{statusLabel}</span>
                <span className="text-[10px] font-black text-violet-700 bg-violet-50 px-2 py-1 rounded-full">Classe {safeText(match.tennisClass, '—')}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <div className="w-14 h-14 rounded-[18px] bg-violet-50 text-violet-700 grid place-items-center shrink-0"><CalendarDays className="w-5 h-5"/></div>
                <div className="min-w-0 flex-1"><p className="text-xs text-slate-500 font-bold">{safeDate(match.date)}</p><h3 className="text-base font-black mt-1 truncate">vs {safeText(opponent, 'Adversário')}</h3><div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/>{safeText(match.startTime, '--:--')} - {safeText(match.endTime, '--:--')}</span><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{safeText(match.courtName, 'Quadra')}</span></div></div>
              </div>
              {outgoing && <div className="mt-3 rounded-[15px] bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-700">O horário está reservado provisoriamente. A partida será confirmada quando o adversário aceitar.</div>}
              {incoming && <div className="mt-3 rounded-[15px] bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700">Você recebeu este convite. Aceite para confirmar a partida ou recuse para liberar o horário.</div>}
              {activeTab === 'upcoming' && <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                {incoming ? <><button type="button" disabled={busyId === match.id} onClick={() => void respond(match, false)} className="flex-1 qp-soft rounded-[15px] py-2.5 text-xs font-black text-rose-600 disabled:opacity-50">Recusar</button><button type="button" disabled={busyId === match.id} onClick={() => void respond(match, true)} className="flex-1 rounded-[15px] py-2.5 text-xs font-black bg-emerald-500 text-white flex items-center justify-center gap-1 disabled:opacity-50"><CheckCircle2 className="w-4 h-4"/>{busyId === match.id ? 'Salvando...' : 'Aceitar'}</button></> : <button type="button" disabled={busyId === match.id} onClick={() => setCancelling(match)} className="w-full qp-soft rounded-[15px] py-2.5 text-xs font-black text-rose-600 flex items-center justify-center gap-1 disabled:opacity-50"><XCircle className="w-4 h-4"/>Cancelar partida</button>}
              </div>}
            </article>
          );
        })}
      </div>

      <ConfirmModal isOpen={!!cancelling} title="Cancelar agendamento?" description={cancelling ? `Cancelar o jogo com ${safeText(cancelling.player1Id === currentUser.id ? cancelling.player2Name : cancelling.player1Name, 'Adversário')} em ${safeDate(cancelling.date)}?` : ''} confirmLabel="Cancelar jogo" cancelLabel="Manter jogo" isDestructive showReasonInput onConfirm={(reason) => void confirmCancellation(reason)} onClose={() => setCancelling(null)} />
    </div>
  );
};
