import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Users, XCircle } from 'lucide-react';
import { Match } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { useAuth } from '../../context/AuthContext';
import { formatFriendlyDate, getBrasiliaToday } from '../../utils/dateUtils';

export const ScheduledGamesView: React.FC = () => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoadError('');
      setMatches(usingSupabase && groupId ? await supabaseAgendaService.getMatches(groupId) : storageService.getMatches());
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
  }, [usingSupabase, groupId]);

  const upcoming = useMemo(() => {
    const today = getBrasiliaToday();
    return matches
      .filter((match) => (match.status === 'scheduled' || match.status === 'pending') && match.date >= today)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [matches]);

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
          <p className="text-xs font-bold text-slate-400">Nosso Tênis</p>
          <h2 className="text-xl font-black text-[#101b3d]">Jogos agendados</h2>
          <p className="text-xs text-slate-500">Todos os próximos jogos do grupo</p>
        </div>
      </section>

      {loadError && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">{loadError}</div>}
      {loading ? (
        <div className="qp-glass rounded-[24px] p-8 text-center text-sm font-bold text-slate-500">Carregando jogos...</div>
      ) : upcoming.length === 0 ? (
        <div className="qp-glass rounded-[24px] p-8 text-center">
          <CalendarDays className="w-9 h-9 mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-700">Nenhum jogo agendado</p>
          <p className="mt-1 text-xs text-slate-500">Os novos agendamentos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {upcoming.map((match) => {
            // Em bancos migrados, usa o ID como regra principal e o nome do
            // perfil como compatibilidade para identificar o convidado.
            const incoming = match.status === 'pending' && !!currentUser && (
              match.player2Id === currentUser.id
              || (match.player2Name || '').trim().toLocaleLowerCase('pt-BR') === (currentUser.name || '').trim().toLocaleLowerCase('pt-BR')
            );
            return <article key={match.id} className="qp-glass rounded-[24px] p-4 border border-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-violet-700">{formatFriendlyDate(match.date)}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-black text-[#101b3d]">
                    <Clock3 className="w-4 h-4 text-violet-600" />
                    {match.startTime} às {match.endTime}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${match.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' : incoming ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                  {match.status === 'scheduled' ? 'Confirmado' : incoming ? 'Convite para você' : 'Aguardando'}
                </span>
              </div>
              <div className="mt-4 rounded-[18px] bg-white/65 p-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="truncate">{match.player1Name} × {match.player2Name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{match.courtName}</span>
                  <span>Classe {match.tennisClass}</span>
                </div>
              </div>
              {incoming && <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button disabled={busyMatchId === match.id} onClick={() => void respond(match, false)} className="flex-1 rounded-[15px] py-2.5 text-xs font-black bg-rose-50 text-rose-600 flex items-center justify-center gap-1.5 disabled:opacity-50"><XCircle className="w-4 h-4" />Recusar</button>
                <button disabled={busyMatchId === match.id} onClick={() => void respond(match, true)} className="flex-1 rounded-[15px] py-2.5 text-xs font-black bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{busyMatchId === match.id ? 'Salvando...' : 'Aceitar'}</button>
              </div>}
            </article>
          })}
        </div>
      )}
    </div>
  );
};
