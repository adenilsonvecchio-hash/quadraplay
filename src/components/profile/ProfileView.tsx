import React, { useEffect, useState } from 'react';
import { Camera, ChevronRight, CircleMinus, LoaderCircle, LogOut, Shield, TrendingUp, Trophy, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { getActiveSportId } from '../../data/sports';
import { Match } from '../../types';

interface ProfileViewProps { onOpenAdmin: () => void; }

interface RecentStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  playedWins: number;
  playedLosses: number;
  walkoverWins: number;
  walkoverLosses: number;
  retirementWins: number;
  retirementLosses: number;
  other: number;
}

const EMPTY_RECENT: RecentStats = { total: 0, wins: 0, losses: 0, draws: 0, playedWins: 0, playedLosses: 0, walkoverWins: 0, walkoverLosses: 0, retirementWins: 0, retirementLosses: 0, other: 0 };

const calculateRecentStats = (matches: Match[], playerId: string): RecentStats => {
  const recent = matches
    .filter((match) => match.resultStatus === 'confirmed' && match.resultOutcome)
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
    .slice(0, 20);
  return recent.reduce<RecentStats>((stats, match) => {
    stats.total += 1;
    const isPlayer1 = match.player1Id === playerId;
    let winner: 1 | 2 | 0 | null = null;
    let category: 'played' | 'walkover' | 'retirement' | 'other' = 'other';
    if (match.resultOutcome === 'played') {
      category = 'played';
      const sets = match.resultScore || [];
      const player1Sets = sets.filter((set) => set.player1 > set.player2).length;
      const player2Sets = sets.filter((set) => set.player2 > set.player1).length;
      winner = player1Sets === player2Sets ? 0 : player1Sets > player2Sets ? 1 : 2;
    } else if (match.resultOutcome === 'walkover_player1') { category = 'walkover'; winner = 1; }
    else if (match.resultOutcome === 'walkover_player2') { category = 'walkover'; winner = 2; }
    else if (match.resultOutcome === 'retirement_player1') { category = 'retirement'; winner = 1; }
    else if (match.resultOutcome === 'retirement_player2') { category = 'retirement'; winner = 2; }
    else if (match.resultOutcome === 'double_walkover') { category = 'walkover'; winner = 0; }

    if (winner === null) { stats.other += 1; return stats; }
    if (winner === 0) { stats.draws += 1; return stats; }
    const won = (winner === 1) === isPlayer1;
    if (won) stats.wins += 1; else stats.losses += 1;
    if (category === 'played') won ? stats.playedWins += 1 : stats.playedLosses += 1;
    if (category === 'walkover') won ? stats.walkoverWins += 1 : stats.walkoverLosses += 1;
    if (category === 'retirement') won ? stats.retirementWins += 1 : stats.retirementLosses += 1;
    return stats;
  }, { ...EMPTY_RECENT });
};

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAdmin }) => {
  const { currentUser, logout, isAdmin, usingSupabase, groupId, updateAvatar } = useAuth();
  const isTennis = getActiveSportId() === 'tenis';
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentStats, setRecentStats] = useState<RecentStats>(EMPTY_RECENT);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const changeAvatar = async (file?: File) => {
    if (!file) return;
    setAvatarBusy(true); setAvatarError('');
    const result = await updateAvatar(file);
    setAvatarBusy(false);
    if (!result.success) setAvatarError(result.error || 'Não foi possível atualizar a foto.');
  };

  const removeAvatar = async () => {
    setAvatarBusy(true); setAvatarError('');
    const result = await updateAvatar(null);
    setAvatarBusy(false);
    if (!result.success) setAvatarError(result.error || 'Não foi possível remover a foto.');
  };

  useEffect(() => {
    if (!currentUser) return;
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        if (usingSupabase && groupId) {
          const today = getBrasiliaToday();
          const playerMatches = await supabaseAgendaService.getMatchesForUser(groupId, currentUser.id);
          const activeMatches = playerMatches.filter((match) => match.status !== 'cancelled');
          const cancelled = playerMatches.filter((match) => match.status === 'cancelled').length;
          const completed = activeMatches.filter((match) =>
            match.status === 'completed'
            || match.date < today
            || (match.date === today && isSlotInPast(match.date, match.startTime)),
          ).length;
          const upcoming = activeMatches.filter((match) =>
            match.status !== 'completed'
            && (match.date > today || (match.date === today && !isSlotInPast(match.date, match.startTime))),
          ).length;
          setStats({ total: activeMatches.length, upcoming, completed, cancelled });
          setRecentStats(calculateRecentStats(playerMatches, currentUser.id));
        } else {
          const allMatches = storageService.getMatches().filter((match) => match.player1Id === currentUser.id || match.player2Id === currentUser.id);
          const matches = storageService.getPlayerMatches(currentUser.id);
          setStats({
            total: matches.upcoming.length + matches.past.length,
            upcoming: matches.upcoming.length,
            completed: matches.past.length,
            cancelled: matches.cancelled.length,
          });
          setRecentStats(calculateRecentStats(allMatches, currentUser.id));
        }
      } catch (error) {
        console.warn('Não foi possível carregar as estatísticas do perfil.', error);
        setStats({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
        setRecentStats(EMPTY_RECENT);
      } finally {
        setStatsLoading(false);
      }
    };
    void loadStats();
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void loadStats());
    return storageService.subscribe(() => void loadStats());
  }, [currentUser, usingSupabase, groupId]);

  if (!currentUser) return null;
  const displayName = typeof currentUser.name === 'string' && currentUser.name.trim() ? currentUser.name.trim() : 'Jogador';
  const displayEmail = typeof currentUser.email === 'string' ? currentUser.email : '';

  return <div className="space-y-4 pb-8">
    <section className="pt-1"><h2 className="text-2xl font-black tracking-tight">Perfil Esportivo</h2><p className="text-xs text-slate-500 mt-1">Seus dados e atividade no RacharHoje.</p></section>

    <section className="qp-card rounded-[28px] p-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <PlayerAvatar name={displayName} avatarUrl={currentUser.avatarUrl} className="w-20 h-20 text-xl ring-4 ring-white shadow-lg" />
          <label className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-amber-500 text-white grid place-items-center shadow-md cursor-pointer" aria-label={currentUser.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}>
            {avatarBusy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" />
          </label>
        </div>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-lg font-black truncate">{displayName}</h3>{currentUser.isAdmin && <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-full">ADMIN</span>}</div><p className="text-xs text-slate-500 truncate">{displayEmail}</p>{isTennis && <span className="inline-block mt-2 text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Classe {currentUser.tennisClass || 'A'}</span>}</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex-1 rounded-[14px] py-2.5 bg-amber-50 text-amber-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"><Camera className="w-4 h-4" />{currentUser.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" /></label>
        {currentUser.avatarUrl && <button type="button" disabled={avatarBusy} onClick={() => void removeAvatar()} className="rounded-[14px] px-4 py-2.5 bg-rose-50 text-rose-600 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"><Trash2 className="w-4 h-4" />Remover</button>}
      </div>
      {avatarError && <p className="mt-2 text-xs font-bold text-rose-600">{avatarError}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4"><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.total}</p><p className="text-[9px] text-slate-400 font-bold">Jogos</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.upcoming}</p><p className="text-[9px] text-slate-400 font-bold">Próximos</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.completed}</p><p className="text-[9px] text-slate-400 font-bold">Realizados</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.cancelled}</p><p className="text-[9px] text-slate-400 font-bold">Cancelados</p></div></div>
    </section>

    <section className="qp-card rounded-[28px] p-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Desempenho recente</p><h3 className="text-lg font-black text-[#101b3d]">Últimos 20 jogos</h3></div>
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center"><TrendingUp className="w-5 h-5" /></div>
      </div>
      {statsLoading ? <div className="py-8 text-center text-sm font-bold text-slate-400">Calculando estatísticas...</div> : recentStats.total === 0 ? <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center"><CircleMinus className="w-7 h-7 mx-auto text-slate-300" /><p className="mt-2 text-sm font-black text-slate-600">Nenhum resultado confirmado</p><p className="mt-1 text-[11px] text-slate-400">As estatísticas aparecerão após a confirmação dos resultados.</p></div> : <>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-emerald-50 p-3 text-center"><p className="text-2xl font-black text-emerald-600">{recentStats.wins}</p><p className="text-[10px] font-black text-emerald-700">Vitórias</p></div>
          <div className="rounded-2xl bg-rose-50 p-3 text-center"><p className="text-2xl font-black text-rose-500">{recentStats.losses}</p><p className="text-[10px] font-black text-rose-600">Derrotas</p></div>
          <div className="rounded-2xl bg-blue-50 p-3 text-center"><p className="text-2xl font-black text-blue-600">{Math.round((recentStats.wins / Math.max(1, recentStats.wins + recentStats.losses)) * 100)}%</p><p className="text-[10px] font-black text-blue-700">Aproveitamento</p></div>
        </div>
        <div className="mt-4 h-4 rounded-full bg-rose-200 overflow-hidden flex" aria-label={`${recentStats.wins} vitórias e ${recentStats.losses} derrotas`}>
          <div className="h-full bg-emerald-500" style={{ width: `${(recentStats.wins / Math.max(1, recentStats.wins + recentStats.losses)) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-black"><span className="text-emerald-600">{recentStats.wins} vitórias</span><span className="text-rose-500">{recentStats.losses} derrotas</span></div>
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
          {[['Jogados', recentStats.playedWins, recentStats.playedLosses], ['W.O.', recentStats.walkoverWins, recentStats.walkoverLosses], ['Desistência', recentStats.retirementWins, recentStats.retirementLosses]].map(([label, wins, losses]) => <div key={String(label)} className="grid grid-cols-[1fr_64px_64px] items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="font-black text-slate-600">{label}</span><span className="font-black text-emerald-600 text-center">{wins} V</span><span className="font-black text-rose-500 text-center">{losses} D</span></div>)}
        </div>
        {(recentStats.draws > 0 || recentStats.other > 0) && <p className="mt-3 text-[10px] font-bold text-slate-400">{recentStats.draws > 0 ? `${recentStats.draws} empate(s). ` : ''}{recentStats.other > 0 ? `${recentStats.other} jogo(s) não concluído(s), sem contar no aproveitamento.` : ''}</p>}
        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400"><Trophy className="w-3.5 h-3.5" />Base: {recentStats.total} resultado(s) confirmado(s)</div>
      </>}
    </section>

    {isAdmin && <button onClick={onOpenAdmin} className="w-full qp-card rounded-[20px] p-4 flex items-center gap-3 text-left"><span className="w-10 h-10 rounded-[15px] bg-amber-100 text-amber-500 grid place-items-center"><Shield className="w-5 h-5"/></span><span className="flex-1"><span className="block text-sm font-black">Administração</span><span className="block text-[10px] text-slate-500">Gerenciar jogadores, horários e bloqueios</span></span><ChevronRight className="w-4 h-4 text-slate-400"/></button>}

    <button onClick={logout} className="w-full rounded-[18px] py-3 bg-rose-50 border border-rose-100 text-xs font-black text-rose-700 flex items-center justify-center gap-2"><LogOut className="w-4 h-4"/>Sair da conta</button>
  </div>;
};
