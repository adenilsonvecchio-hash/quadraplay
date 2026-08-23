import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, CheckCircle2, X, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { storageService } from '../../services/storageService';
import { Match } from '../../types';

interface NotificationsBellProps {
  variant?: 'light' | 'dark';
  onOpenMatches: () => void;
}

const formatDate = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

export const NotificationsBell: React.FC<NotificationsBellProps> = ({ variant = 'light', onOpenMatches }) => {
  const { currentUser, groupId, usingSupabase } = useAuth();
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser || !groupId) return;
    setLoading(true);
    try {
      const result = usingSupabase
        ? await supabaseAgendaService.getMatches(groupId)
        : storageService.getMatches();
      setMatches(result.filter((match) => match.player1Id === currentUser.id || match.player2Id === currentUser.id));
    } catch (error) {
      // O sino nunca deve interromper o restante do aplicativo.
      console.warn('Não foi possível atualizar as notificações.', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, groupId, usingSupabase]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!usingSupabase || !groupId) return undefined;
    try {
      return supabaseAgendaService.subscribeToMatches(groupId, () => { void load(); });
    } catch (error) {
      console.warn('Notificações em tempo real indisponíveis.', error);
      return undefined;
    }
  }, [groupId, load, usingSupabase]);

  const notifications = useMemo(() => matches
    .filter((match) => match.status === 'pending' || match.status === 'scheduled' || match.status === 'cancelled')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 8), [matches]);

  const pendingCount = matches.filter((match) => match.status === 'pending' && match.player2Id === currentUser?.id).length;

  const selectNotification = () => {
    setOpen(false);
    onOpenMatches();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={variant === 'dark' ? 'qp-clean-home__bell' : 'qp-icon-btn w-12 h-12 relative'}
        aria-label={open ? 'Fechar notificações' : 'Abrir notificações'}
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && <span className="qp-notification-count">{pendingCount > 9 ? '9+' : pendingCount}</span>}
      </button>

      {open && (
        <div className="qp-notification-layer" role="presentation" onClick={() => setOpen(false)}>
          <section className="qp-notification-panel" role="dialog" aria-modal="true" aria-label="Notificações" onClick={(event) => event.stopPropagation()}>
            <div className="qp-notification-heading">
              <div><strong>Notificações</strong><small>Atualizações dos seus jogos</small></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar notificações"><X size={20} /></button>
            </div>
            <div className="qp-notification-list">
              {loading && notifications.length === 0 && <p className="qp-notification-empty">Carregando...</p>}
              {!loading && notifications.length === 0 && <p className="qp-notification-empty">Nenhuma notificação no momento.</p>}
              {notifications.map((match) => {
                const isInvite = match.status === 'pending' && match.player2Id === currentUser?.id;
                const isCancelled = match.status === 'cancelled';
                const Icon = isCancelled ? XCircle : isInvite ? CalendarDays : CheckCircle2;
                const title = isCancelled ? 'Partida cancelada' : isInvite ? 'Novo convite recebido' : match.status === 'pending' ? 'Convite enviado' : 'Partida confirmada';
                const opponent = match.player1Id === currentUser?.id ? match.player2Name : match.player1Name;
                return (
                  <button type="button" key={match.id} className="qp-notification-item" onClick={selectNotification}>
                    <span className={`qp-notification-icon ${isCancelled ? 'is-cancelled' : isInvite ? 'is-pending' : 'is-confirmed'}`}><Icon size={18} /></span>
                    <span><strong>{title}</strong><small>{opponent} · {formatDate(match.date)} · {match.startTime}</small></span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
};
