import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Match } from '../types';
import { storageService } from '../services/storageService';
import { supabaseAgendaService } from '../services/supabaseAgendaService';

export interface MatchNotification {
  id: string;
  title: string;
  detail: string;
  unread: boolean;
}

export const useMatchNotifications = () => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const all = usingSupabase && groupId
        ? await supabaseAgendaService.getMatches(groupId)
        : storageService.getMatches();
      setMatches(all.filter((match) => match.player1Id === currentUser.id || match.player2Id === currentUser.id));
    };
    void load().catch(() => setMatches([]));
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void load());
    return storageService.subscribe(() => void load());
  }, [currentUser, usingSupabase, groupId]);

  const notifications = useMemo<MatchNotification[]>(() => {
    if (!currentUser) return [];
    return [...matches]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((match) => {
        const opponent = match.player1Id === currentUser.id ? match.player2Name : match.player1Name;
        const detail = `${match.date.split('-').reverse().join('/')} · ${match.startTime} · ${match.courtName}`;
        const isInvitedPlayer = match.player2Id === currentUser.id
          || match.player2Name.trim().toLocaleLowerCase('pt-BR') === currentUser.name.trim().toLocaleLowerCase('pt-BR');
        if (match.status === 'pending' && isInvitedPlayer) return { id: match.id, title: `Convite de ${opponent}`, detail, unread: true };
        if (match.status === 'pending') return { id: match.id, title: `Aguardando ${opponent}`, detail, unread: false };
        if (match.status === 'scheduled') return { id: match.id, title: `Partida confirmada com ${opponent}`, detail, unread: false };
        if (match.status === 'cancelled') return { id: match.id, title: `Partida cancelada com ${opponent}`, detail, unread: false };
        return { id: match.id, title: `Partida realizada com ${opponent}`, detail, unread: false };
      });
  }, [matches, currentUser]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => item.unread).length,
  };
};
