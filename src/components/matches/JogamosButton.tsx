import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);

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

  // Todos os jogos agendados que ainda não passaram, do mais próximo para o
  // mais distante.
  const eligibleMatches = useMemo(() => {
    const today = getBrasiliaToday();
    return matches
      .filter((m) => m.status === 'scheduled' && (m.date >= today || !isSlotInPast(m.date, m.endTime)))
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [matches]);

  const jaConfirmouEste = (m: Match) =>
    Boolean(currentUser && (currentUser.id === m.player1Id ? m.checkedPlayer1At : m.checkedPlayer2At));

  // Só faz sentido escolher entre jogos que ele ainda não confirmou — uma
  // vez confirmado, não há nada para o jogador decidir ali.
  const pendingMatches = useMemo(
    () => eligibleMatches.filter((m) => !jaConfirmouEste(m)),
    [eligibleMatches, currentUser?.id],
  );

  useEffect(() => {
    // Se sobrar só um jogo pendente, seleciona sozinho — não faz sentido
    // perguntar quando não há escolha real.
    if (pendingMatches.length === 1) setChosenId(pendingMatches[0].id);
    if (pendingMatches.length === 0) setChosenId(null);
  }, [pendingMatches.map((m) => m.id).join(',')]);

  const chosenMatch = pendingMatches.find((m) => m.id === chosenId) || null;
  const lastConfirmedMatch = eligibleMatches.find((m) => jaConfirmouEste(m)) || null;

  if (eligibleMatches.length === 0) return null;

  const confirmar = async (match: Match) => {
    if (!currentUser || status === 'sending') return;
    setPickerOpen(false);
    setStatus('sending');
    try {
      // 1) Confirma a presença na hora — não espera o GPS. O jogador vê
      // "pronto" imediatamente, sem qualquer indício de que localização
      // está envolvida.
      if (usingSupabase) {
        const result = await supabaseAgendaService.confirmarPresenca(match.id);
        setMessage(result.ambosConfirmaram ? 'Presença dos dois jogadores confirmada!' : 'Presença registrada!');
      } else {
        setMessage('Presença registrada!');
      }
      setStatus('done');
      setChosenId(match.id);
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
            await supabaseAgendaService.confirmarPresenca(match.id, coords);
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

  // Nenhum jogo pendente: todos os agendados já foram confirmados por ele.
  if (pendingMatches.length === 0) {
    const m = lastConfirmedMatch;
    if (!m) return null;
    return (
      <div className="qp-jogamos-wrap">
        <div className="qp-jogamos-button qp-jogamos-button--done" aria-live="polite">
          <CheckCircle2 className="w-6 h-6" />
          <span className="qp-jogamos-button__copy"><strong>Presença confirmada</strong><small>{m.player1Name} × {m.player2Name}</small></span>
        </div>
      </div>
    );
  }

  const handleTap = () => {
    if (status === 'sending') return;
    if (pendingMatches.length > 1 && !chosenMatch) {
      setPickerOpen((open) => !open);
      return;
    }
    if (chosenMatch) void confirmar(chosenMatch);
  };

  return (
    <div className="qp-jogamos-wrap">
      <button
        type="button"
        className={`qp-jogamos-button ${status === 'done' ? 'qp-jogamos-button--done' : ''} ${status === 'error' ? 'qp-jogamos-button--error' : ''}`}
        onClick={handleTap}
        disabled={status === 'sending'}
        aria-label={pendingMatches.length > 1 && !chosenMatch ? 'Escolher o jogo para confirmar presença' : 'Confirmar presença na partida'}
      >
        {status === 'sending' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : null}
        <span className="qp-jogamos-button__copy">
          <strong>
            {status === 'sending' ? 'Registrando...' : status !== 'idle' ? message : chosenMatch ? '🎾 JOGAMOS' : 'Escolher jogo'}
          </strong>
          {status === 'idle' && (
            <small>
              {chosenMatch
                ? `${chosenMatch.player1Name} × ${chosenMatch.player2Name}`
                : `${pendingMatches.length} jogos agendados`}
            </small>
          )}
        </span>
        {pendingMatches.length > 1 && !chosenMatch && status === 'idle' && <ChevronDown className="w-4 h-4" />}
      </button>

      {pickerOpen && (
        <div className="qp-jogamos-picker" role="listbox" aria-label="Escolha o jogo">
          {pendingMatches.map((m) => (
            <button
              key={m.id}
              type="button"
              className="qp-jogamos-picker__item"
              onClick={() => void confirmar(m)}
            >
              <strong>{m.player1Name} × {m.player2Name}</strong>
              <small>{m.date.split('-').reverse().join('/')} • {m.startTime}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
