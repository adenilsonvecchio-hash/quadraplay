import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, MapPin, Trophy, XCircle } from 'lucide-react';
import { Match, MatchOutcome, MatchScoreSet } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { useAuth } from '../../context/AuthContext';
import { formatFriendlyDate, getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { getActiveSportId, getSport } from '../../data/sports';
import { MatchResultModal } from './MatchResultModal';

export const ScheduledGamesView: React.FC = () => {
  const isTennis = getActiveSportId() === 'tenis';
  const activeSportName = getSport(getActiveSportId()).name;
  const { currentUser, allPlayers, usingSupabase, groupId } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [resultMatch, setResultMatch] = useState<Match | null>(null);

  const load = async () => {
    if (!currentUser) {
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      setLoadError('');
      const playerMatches = usingSupabase && groupId
        ? await supabaseAgendaService.getMatchesForUser(groupId, currentUser.id)
        : storageService.getMatches().filter((match) => match.player1Id === currentUser.id || match.player2Id === currentUser.id);
      setMatches(playerMatches);
    } catch {
      setLoadError('Não foi possível carregar os jogos do banco.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void load());
    return storageService.subscribe(() => void load());
  }, [usingSupabase, groupId, currentUser?.id]);

  const visibleMatches = useMemo(() => {
    const today = getBrasiliaToday();
    return matches
      .filter((match) =>
        (match.status === 'scheduled' || match.status === 'pending' || match.status === 'completed')
        && (match.date >= today || !!match.resultStatus || isSlotInPast(match.date, match.endTime)),
      )
      .sort((a, b) => {
        const aPast = isSlotInPast(a.date, a.endTime) ? 1 : 0;
        const bPast = isSlotInPast(b.date, b.endTime) ? 1 : 0;
        return aPast - bPast || `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
      });
  }, [matches]);

  const saveResult = async (outcome: MatchOutcome, score: MatchScoreSet[]) => {
    if (!currentUser || !resultMatch) return;
    setBusyMatchId(resultMatch.id); setLoadError('');
    try {
      if (usingSupabase) await supabaseAgendaService.submitMatchResult(resultMatch.id, currentUser.id, outcome, score);
      else {
        const result = storageService.submitMatchResult(resultMatch.id, currentUser.id, outcome, score);
        if (!result.success) throw new Error(result.error);
      }
      setResultMatch(null);
      await load();
    } catch { setLoadError('Não foi possível registrar o resultado. Tente novamente.'); }
    finally { setBusyMatchId(null); }
  };

  const reviewResult = async (match: Match, confirm: boolean) => {
    if (!currentUser) return;
    setBusyMatchId(match.id); setLoadError('');
    try {
      if (usingSupabase) await supabaseAgendaService.reviewMatchResult(match.id, currentUser.id, confirm);
      else {
        const result = storageService.reviewMatchResult(match.id, currentUser.id, confirm);
        if (!result.success) throw new Error(result.error);
      }
      await load();
    } catch { setLoadError('Não foi possível analisar o resultado. Tente novamente.'); }
    finally { setBusyMatchId(null); }
  };

  const outcomeLabel = (match: Match) => {
    const labels: Partial<Record<MatchOutcome, string>> = {
      not_played: 'Jogo não aconteceu',
      walkover_player1: `W.O. — vitória de ${match.player1Name}`,
      walkover_player2: `W.O. — vitória de ${match.player2Name}`,
      double_walkover: 'W.O. duplo',
      retirement_player1: `Desistência — vitória de ${match.player1Name}`,
      retirement_player2: `Desistência — vitória de ${match.player2Name}`,
      interrupted: 'Jogo interrompido', reschedule: 'Partida será remarcada',
    };
    if (match.resultOutcome === 'played') return (match.resultScore || []).map((set) => `${set.player1} × ${set.player2}`).join('  |  ');
    return match.resultOutcome ? labels[match.resultOutcome] : '';
  };

  const respond = async (match: Match, accept: boolean) => {
    if (!currentUser) return;
    setBusyMatchId(match.id);
    setLoadError('');
    try {
      if (usingSupabase) await supabaseAgendaService.respondToMatch(match.id, currentUser.id, accept);
      else {
        const result = storageService.respondToMatch(match.id, currentUser.id, accept);
        if (!result.success) throw new Error(result.error);
      }
      await load();
    } catch {
      setLoadError('Não foi possível responder ao convite. Tente novamente.');
    } finally {
      setBusyMatchId(null);
    }
  };

  return (
    <div className="space-y-3 pb-4">
      <section className="qp-glass rounded-[26px] p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-[18px] bg-blue-100 text-blue-700 flex items-center justify-center">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400">{activeSportName} · Multiesportes</p>
          <h2 className="text-xl font-black text-[#101b3d]">Jogos agendados</h2>
          <p className="text-xs text-slate-500">Próximos jogos e registro de resultados</p>
        </div>
      </section>

      {loadError && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">{loadError}</div>}
      {loading ? (
        <div className="qp-glass rounded-[24px] p-8 text-center text-sm font-bold text-slate-500">Carregando jogos...</div>
      ) : visibleMatches.length === 0 ? (
        <div className="qp-glass rounded-[24px] p-8 text-center">
          <CalendarDays className="w-9 h-9 mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-700">Nenhum jogo agendado</p>
          <p className="mt-1 text-xs text-slate-500">Os novos agendamentos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleMatches.map((match) => {
            const player1 = allPlayers.find((player) => player.id === match.player1Id);
            const player2 = allPlayers.find((player) => player.id === match.player2Id);
            // Em bancos migrados, usa o ID como regra principal e o nome do
            // perfil como compatibilidade para identificar o convidado.
            const incoming = match.status === 'pending' && !!currentUser && (
              match.player2Id === currentUser.id
              || (match.player2Name || '').trim().toLocaleLowerCase('pt-BR') === (currentUser.name || '').trim().toLocaleLowerCase('pt-BR')
            );
            const finishedTime = isSlotInPast(match.date, match.endTime);
            const isParticipant = !!currentUser && (match.player1Id === currentUser.id || match.player2Id === currentUser.id);
            const canSubmitResult = match.status === 'scheduled' && finishedTime && isParticipant && (!match.resultStatus || match.resultStatus === 'disputed');
            const canReviewResult = match.resultStatus === 'pending_confirmation' && isParticipant && match.resultSubmittedBy !== currentUser?.id;
            return <article key={match.id} className="qp-glass rounded-[24px] p-4 border border-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-700">{formatFriendlyDate(match.date)}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-black text-[#101b3d]">
                    <Clock3 className="w-4 h-4 text-amber-500" />
                    {match.startTime} às {match.endTime}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${match.status === 'completed' ? 'bg-blue-100 text-blue-700' : match.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' : incoming ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'}`}>
                  {match.status === 'completed' ? 'Concluído' : match.status === 'scheduled' ? 'Confirmado' : incoming ? 'Convite para você' : 'Aguardando'}
                </span>
              </div>
              <div className="mt-4 rounded-[18px] bg-white/65 p-3">
                <div className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <div className="flex shrink-0 -space-x-2" aria-label="Fotos dos jogadores">
                    <PlayerAvatar name={match.player1Name} avatarUrl={player1?.avatarUrl} className="w-10 h-10 text-[10px] ring-2 ring-white" />
                    <PlayerAvatar name={match.player2Name} avatarUrl={player2?.avatarUrl} className="w-10 h-10 text-[10px] ring-2 ring-white" />
                  </div>
                  <span className="truncate">{match.player1Name} × {match.player2Name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{match.courtName}</span>
                  {isTennis && <span>Classe {match.tennisClass}</span>}
                </div>
              </div>
              {incoming && <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button disabled={busyMatchId === match.id} onClick={() => void respond(match, false)} className="flex-1 rounded-[15px] py-2.5 text-xs font-black bg-rose-50 text-rose-600 flex items-center justify-center gap-1.5 disabled:opacity-50"><XCircle className="w-4 h-4" />Recusar</button>
                <button disabled={busyMatchId === match.id} onClick={() => void respond(match, true)} className="flex-1 rounded-[15px] py-2.5 text-xs font-black bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{busyMatchId === match.id ? 'Salvando...' : 'Aceitar'}</button>
              </div>}
              {match.resultStatus && <div className={`mt-3 rounded-[16px] p-3 text-xs font-bold ${match.resultStatus === 'disputed' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-800'}`}>
                <div className="flex items-center gap-2 font-black"><Trophy className="w-4 h-4" />{outcomeLabel(match)}</div>
                <p className="mt-1 text-[10px] uppercase tracking-wide">{match.resultStatus === 'pending_confirmation' ? 'Aguardando confirmação do adversário' : match.resultStatus === 'disputed' ? 'Resultado contestado — informe novamente ou procure o administrador' : 'Resultado confirmado'}</p>
              </div>}
              {canSubmitResult && <button type="button" disabled={busyMatchId === match.id} onClick={() => setResultMatch(match)} className="mt-3 w-full rounded-[15px] py-2.5 text-xs font-black bg-[#101b3d] text-white flex items-center justify-center gap-2 disabled:opacity-50"><Trophy className="w-4 h-4" />{match.resultStatus === 'disputed' ? 'Corrigir resultado' : 'Informar resultado'}</button>}
              {canReviewResult && <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" disabled={busyMatchId === match.id} onClick={() => void reviewResult(match, false)} className="rounded-[15px] py-2.5 text-xs font-black bg-rose-50 text-rose-700 flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4" />Contestar</button>
                <button type="button" disabled={busyMatchId === match.id} onClick={() => void reviewResult(match, true)} className="rounded-[15px] py-2.5 text-xs font-black bg-emerald-500 text-white flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" />Confirmar</button>
              </div>}
            </article>
          })}
        </div>
      )}
      {resultMatch && <MatchResultModal match={resultMatch} isTennis={isTennis} busy={busyMatchId === resultMatch.id} onClose={() => setResultMatch(null)} onSubmit={(outcome, score) => void saveResult(outcome, score)} />}
    </div>
  );
};
