import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { Match } from '../../types';
import { getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';

// Pede a localização de forma totalmente silenciosa, sem qualquer efeito na
// tela do jogador: chamada em segundo plano, depois da presença já estar
// confirmada. Se demorar ou falhar, simplesmente não anexa localização.
const getCoordsQuietly = (): Promise<{ lat: number; lng: number } | undefined> =>
  new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(undefined);
    const timeout = window.setTimeout(() => resolve(undefined), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { window.clearTimeout(timeout); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { window.clearTimeout(timeout); resolve(undefined); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });

export const JogamosButton: React.FC = () => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentUser) return;
      const data = usingSupabase && groupId
        ? await supabaseAgendaService.getMatchesForUser(groupId, currentUser.id)
        : storageService.getMatches().filter((m) => m.player1Id === currentUser.id || m.player2Id === currentUser.id);
      if (active) setMatches(data);
    };
    void load();
    return () => { active = false; };
  }, [currentUser?.id, usingSupabase, groupId]);

  const currentMatch = useMemo(() => {
    const today = getBrasiliaToday();
    return matches
      .filter((m) => m.status === 'scheduled' && (m.date >= today || !isSlotInPast(m.date, m.endTime)))
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0] || null;
  }, [matches]);

  const jaConfirmei = useMemo(() => {
    if (!currentMatch || !currentUser) return false;
    return Boolean(currentUser.id === currentMatch.player1Id ? currentMatch.checkedPlayer1At : currentMatch.checkedPlayer2At);
  }, [currentMatch, currentUser]);

  if (!currentMatch) return null;

  const confirmar = async () => {
    if (!currentUser || status === 'sending') return;
    setStatus('sending');
    try {
      // 1) Confirma a presença na hora — não espera o GPS. O jogador vê
      // "pronto" imediatamente, sem qualquer indício de que localização
      // está envolvida.
      if (usingSupabase) {
        const result = await supabaseAgendaService.confirmarPresenca(currentMatch.id);
        setMessage(result.ambosConfirmaram ? 'Presença dos dois jogadores confirmada!' : 'Presença registrada!');
      } else {
        setMessage('Presença registrada!');
      }
      setStatus('done');
      window.setTimeout(() => setStatus('idle'), 2500);

      // 2) Em segundo plano, sem bloquear a tela nem mostrar nada ao
      // jogador: tenta obter a localização e anexá-la à checagem já feita.
      // Se demorar, falhar ou a permissão for negada, não muda nada do que
      // o jogador vê — a presença já está confirmada de qualquer forma.
      if (usingSupabase) {
        void (async () => {
          const coords = await getCoordsQuietly();
          if (!coords) return;
          try {
            await supabaseAgendaService.confirmarPresenca(currentMatch.id, coords);
          } catch {
            // Falha silenciosa: a localização é um sinal extra para o
            // admin, nunca um bloqueio para o jogador.
          }
        })();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível registrar sua presença.');
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (jaConfirmei && status === 'idle') {
    return (
      <div className="qp-jogamos-button qp-jogamos-button--done" aria-live="polite">
        <CheckCircle2 className="w-6 h-6" />
        <span className="qp-jogamos-button__copy"><strong>Presença confirmada</strong><small>{currentMatch.player1Name} × {currentMatch.player2Name}</small></span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`qp-jogamos-button ${status === 'done' ? 'qp-jogamos-button--done' : ''} ${status === 'error' ? 'qp-jogamos-button--error' : ''}`}
      onClick={() => void confirmar()}
      disabled={status === 'sending'}
      aria-label="Confirmar presença na partida"
    >
      {status === 'sending' ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : status === 'done' ? (
        <CheckCircle2 className="w-6 h-6" />
      ) : null}
      <span className="qp-jogamos-button__copy">
        <strong>{status === 'idle' ? '🎾 JOGAMOS' : status === 'sending' ? 'Registrando...' : message}</strong>
        {status === 'idle' && <small>{currentMatch.player1Name} × {currentMatch.player2Name}</small>}
      </span>
    </button>
  );
};
