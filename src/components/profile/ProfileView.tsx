import React, { useEffect, useState } from 'react';
import { Camera, ChevronRight, LoaderCircle, LogOut, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { getActiveSportId } from '../../data/sports';

interface ProfileViewProps { onOpenAdmin: () => void; }

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAdmin }) => {
  const { currentUser, logout, isAdmin, usingSupabase, groupId, updateAvatar } = useAuth();
  const isTennis = getActiveSportId() === 'tenis';
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
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
        } else {
          const matches = storageService.getPlayerMatches(currentUser.id);
          setStats({
            total: matches.upcoming.length + matches.past.length,
            upcoming: matches.upcoming.length,
            completed: matches.past.length,
            cancelled: matches.cancelled.length,
          });
        }
      } catch (error) {
        console.warn('Não foi possível carregar as estatísticas do perfil.', error);
        setStats({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
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
    <section className="pt-1"><h2 className="text-2xl font-black tracking-tight">Perfil Esportivo</h2><p className="text-xs text-slate-500 mt-1">Seus dados e atividade no QuadraPlay.</p></section>

    <section className="qp-card rounded-[28px] p-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <PlayerAvatar name={displayName} avatarUrl={currentUser.avatarUrl} className="w-20 h-20 text-xl ring-4 ring-white shadow-lg" />
          <label className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-violet-600 text-white grid place-items-center shadow-md cursor-pointer" aria-label={currentUser.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}>
            {avatarBusy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" />
          </label>
        </div>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-lg font-black truncate">{displayName}</h3>{currentUser.isAdmin && <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-full">ADMIN</span>}</div><p className="text-xs text-slate-500 truncate">{displayEmail}</p>{isTennis && <span className="inline-block mt-2 text-[10px] font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">Classe {currentUser.tennisClass || 'A'}</span>}</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex-1 rounded-[14px] py-2.5 bg-violet-50 text-violet-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"><Camera className="w-4 h-4" />{currentUser.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" /></label>
        {currentUser.avatarUrl && <button type="button" disabled={avatarBusy} onClick={() => void removeAvatar()} className="rounded-[14px] px-4 py-2.5 bg-rose-50 text-rose-600 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"><Trash2 className="w-4 h-4" />Remover</button>}
      </div>
      {avatarError && <p className="mt-2 text-xs font-bold text-rose-600">{avatarError}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4"><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.total}</p><p className="text-[9px] text-slate-400 font-bold">Jogos</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.upcoming}</p><p className="text-[9px] text-slate-400 font-bold">Próximos</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.completed}</p><p className="text-[9px] text-slate-400 font-bold">Realizados</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.cancelled}</p><p className="text-[9px] text-slate-400 font-bold">Cancelados</p></div></div>
    </section>

    {isAdmin && <button onClick={onOpenAdmin} className="w-full qp-card rounded-[20px] p-4 flex items-center gap-3 text-left"><span className="w-10 h-10 rounded-[15px] bg-violet-100 text-violet-600 grid place-items-center"><Shield className="w-5 h-5"/></span><span className="flex-1"><span className="block text-sm font-black">Administração</span><span className="block text-[10px] text-slate-500">Gerenciar jogadores, horários e bloqueios</span></span><ChevronRight className="w-4 h-4 text-slate-400"/></button>}

    <button onClick={logout} className="w-full rounded-[18px] py-3 bg-rose-50 border border-rose-100 text-xs font-black text-rose-700 flex items-center justify-center gap-2"><LogOut className="w-4 h-4"/>Sair da conta</button>
  </div>;
};
