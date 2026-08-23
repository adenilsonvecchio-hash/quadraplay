import React, { useEffect, useState } from 'react';
import { ChevronRight, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';

interface ProfileViewProps { onOpenAdmin: () => void; }

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAdmin }) => {
  const { currentUser, logout, isAdmin, usingSupabase, groupId } = useAuth();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        if (usingSupabase && groupId) {
          const today = getBrasiliaToday();
          const playerMatches = (await supabaseAgendaService.getMatches(groupId)).filter(
            (match) => match.player1Id === currentUser.id || match.player2Id === currentUser.id,
          );
          const activeMatches = playerMatches.filter((match) => match.status !== 'cancelled');
          const completed = activeMatches.filter((match) =>
            match.status === 'completed'
            || match.date < today
            || (match.date === today && isSlotInPast(match.date, match.startTime)),
          ).length;
          const upcoming = activeMatches.filter((match) =>
            match.status !== 'completed'
            && (match.date > today || (match.date === today && !isSlotInPast(match.date, match.startTime))),
          ).length;
          setStats({ total: activeMatches.length, upcoming, completed });
        } else {
          const matches = storageService.getPlayerMatches(currentUser.id);
          setStats({
            total: matches.upcoming.length + matches.past.length,
            upcoming: matches.upcoming.length,
            completed: matches.past.length,
          });
        }
      } catch (error) {
        console.warn('Não foi possível carregar as estatísticas do perfil.', error);
        setStats({ total: 0, upcoming: 0, completed: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    void loadStats();
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void loadStats());
    return storageService.subscribe(() => void loadStats());
  }, [currentUser, usingSupabase, groupId]);

  if (!currentUser) return null;

  return <div className="space-y-4 pb-8">
    <section className="pt-1"><h2 className="text-2xl font-black tracking-tight">Perfil Esportivo</h2><p className="text-xs text-slate-500 mt-1">Seus dados e atividade no QuadraPlay.</p></section>

    <section className="qp-card rounded-[28px] p-4">
      <div className="flex items-center gap-3"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white grid place-items-center text-xl font-black shadow-lg">{currentUser.name.charAt(0)}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-lg font-black truncate">{currentUser.name}</h3>{currentUser.isAdmin && <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-full">ADMIN</span>}</div><p className="text-xs text-slate-500 truncate">{currentUser.email}</p><span className="inline-block mt-2 text-[10px] font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">Classe {currentUser.tennisClass}</span></div></div>
      <div className="grid grid-cols-3 gap-2 mt-4"><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.total}</p><p className="text-[9px] text-slate-400 font-bold">Jogos</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.upcoming}</p><p className="text-[9px] text-slate-400 font-bold">Próximos</p></div><div className="qp-soft rounded-[17px] p-3 text-center"><p className="text-lg font-black">{statsLoading ? '—' : stats.completed}</p><p className="text-[9px] text-slate-400 font-bold">Realizados</p></div></div>
    </section>

    {isAdmin && <button onClick={onOpenAdmin} className="w-full qp-card rounded-[20px] p-4 flex items-center gap-3 text-left"><span className="w-10 h-10 rounded-[15px] bg-violet-100 text-violet-600 grid place-items-center"><Shield className="w-5 h-5"/></span><span className="flex-1"><span className="block text-sm font-black">Administração</span><span className="block text-[10px] text-slate-500">Gerenciar jogadores, horários e bloqueios</span></span><ChevronRight className="w-4 h-4 text-slate-400"/></button>}

    <button onClick={logout} className="w-full rounded-[18px] py-3 bg-rose-50 border border-rose-100 text-xs font-black text-rose-700 flex items-center justify-center gap-2"><LogOut className="w-4 h-4"/>Sair da conta</button>
  </div>;
};
