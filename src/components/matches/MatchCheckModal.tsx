import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Copy, ExternalLink, QrCode, Smartphone, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { Match } from '../../types';
import { getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';

type Props = { onClose: () => void };
const TOKEN_TTL_MS = 60000;

const encodePayload = (payload: object) => {
  const text = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(text)));
  // QR como URL HTTPS: a câmera nativa do iPhone/Android reconhece e abre o Saque ON.
  return `${window.location.origin}${window.location.pathname}?check=${encodeURIComponent(encoded)}`;
};

const decodePayload = (value: string) => {
  try {
    const source = value.includes('?check=') ? new URL(value).searchParams.get('check') || '' : value;
    const encoded = source.includes('saqueon://check/') ? source.split('saqueon://check/')[1] : source;
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
};

export const MatchCheckModal: React.FC<Props> = ({ onClose }) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(60);
  const [issuedAt, setIssuedAt] = useState(() => Date.now());
  const [mode, setMode] = useState<'show' | 'scan'>('show');
  const [scanMessage, setScanMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adversaryValidated, setAdversaryValidated] = useState(false);
  const [bothValidated, setBothValidated] = useState(false);
  const [checking, setChecking] = useState(false);

  const currentMatch = useMemo(() => {
    const today = getBrasiliaToday();
    return matches
      .filter((m) => (m.status === 'scheduled' || m.status === 'pending') && (m.date >= today || !isSlotInPast(m.date, m.endTime)))
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0] || null;
  }, [matches]);

  const token = useMemo(() => currentMatch && currentUser ? encodePayload({
    v: 2,
    matchId: currentMatch.id,
    playerId: currentUser.id,
    issuedAt,
  }) : '', [currentMatch, currentUser, issuedAt]);

  const qrUrl = token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(token)}`
    : '';

  const refreshMatches = async () => {
    if (!currentUser) return;
    const data = usingSupabase && groupId
      ? await supabaseAgendaService.getMatchesForUser(groupId, currentUser.id)
      : storageService.getMatches().filter((m) => m.player1Id === currentUser.id || m.player2Id === currentUser.id);
    setMatches(data);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentUser) return;
      try {
        const data = usingSupabase && groupId
          ? await supabaseAgendaService.getMatchesForUser(groupId, currentUser.id)
          : storageService.getMatches().filter((m) => m.player1Id === currentUser.id || m.player2Id === currentUser.id);
        if (active) setMatches(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [currentUser?.id, usingSupabase, groupId]);

  useEffect(() => {
    if (!currentMatch) return;
    setAdversaryValidated(Boolean(currentUser?.id === currentMatch.player1Id ? currentMatch.checkedPlayer2At : currentMatch.checkedPlayer1At));
    setBothValidated(Boolean(currentMatch.checkedPlayer1At && currentMatch.checkedPlayer2At));
  }, [currentMatch, currentUser?.id]);

  useEffect(() => {
    if (mode !== 'show' || !currentMatch) return;
    setIssuedAt(Date.now());
    setSeconds(60);
  }, [mode, currentMatch?.id]);

  useEffect(() => {
    if (mode !== 'show' || !token) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((issuedAt + TOKEN_TTL_MS - Date.now()) / 1000));
      setSeconds(left);
      if (left <= 0) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [mode, token, issuedAt]);

  const validateDecoded = async (raw: string) => {
    const payload = decodePayload(raw);
    if (!payload?.issuedAt || !payload.matchId || !payload.playerId) {
      setScanMessage('QR Code inválido.');
      return false;
    }
    if (Date.now() - Number(payload.issuedAt) > TOKEN_TTL_MS) {
      setScanMessage('QR expirado. Peça ao jogador para gerar um novo código.');
      return false;
    }
    if (String(payload.matchId) !== String(currentMatch?.id)) {
      setScanMessage('Este QR pertence a outra partida.');
      return false;
    }
    if (String(payload.playerId) === String(currentUser?.id)) {
      setScanMessage('Você não pode validar seu próprio QR. Escaneie o QR do adversário.');
      return false;
    }

    setChecking(true);
    try {
      const result = usingSupabase
        ? await supabaseAgendaService.checkMatchByQr(String(payload.matchId), String(payload.playerId), Number(payload.issuedAt))
        : { adversaryName: 'Adversário', adversaryValidated: false, bothValidated: false };
      setAdversaryValidated(result.adversaryValidated);
      setBothValidated(result.bothValidated);
      setScanSuccess(true);
      setScanMessage(result.bothValidated
        ? 'As duas checagens foram concluídas. A partida está validada.'
        : `Você confirmou a presença de ${result.adversaryName}. Agora é a vez dele confirmar a sua.`);
      return true;
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : 'Não foi possível validar esta partida.');
      return false;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const check = new URLSearchParams(window.location.search).get('check');
    if (!check || !currentMatch || !currentUser || scanSuccess || checking) return;
    const raw = decodePayload(check);
    if (!raw) {
      setScanMessage('QR de validação inválido.');
      return;
    }
    setMode('scan');
    setScanMessage('QR recebido pela câmera nativa. Validando sua presença...');
    void validateDecoded(check).then((ok) => {
      if (ok) {
        const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(null, '', cleanUrl);
      }
    });
  }, [currentMatch?.id, currentUser?.id]);

  const regenerate = () => {
    setIssuedAt(Date.now());
    setSeconds(60);
    setScanMessage('');
    setScanSuccess(false);
  };

  const startScan = () => {
    setScanSuccess(false);
    setScanMessage('Abra a Câmera do celular e aponte para o QR do adversário. Ao tocar no link do SAQUE ON, a validação será feita automaticamente.');
    setMode('scan');
  };

  const returnToMyQr = () => {
    setScanMessage('Agora mostre o seu QR para o adversário escanear.');
    setScanSuccess(false);
    setMode('show');
  };

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard?.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return <div className="qp-check-modal-layer" role="dialog" aria-modal="true" aria-label="Checar partida">
    <div className="qp-check-modal">
      <div className="qp-check-modal__header">
        <div><span>VALIDAÇÃO DA PARTIDA</span><h2>Checar partida</h2></div>
        <button type="button" onClick={onClose} aria-label="Fechar"><X className="w-5 h-5" /></button>
      </div>

      <div className="qp-check-modal__body">
        {loading ? <div className="qp-check-empty">Carregando seu próximo jogo...</div> : !currentMatch ? (
          <div className="qp-check-empty"><QrCode className="w-10 h-10 mx-auto text-slate-300" /><strong>Nenhuma partida disponível</strong><p>Agende um jogo para gerar o código de validação.</p></div>
        ) : (
          <>
            <div className="qp-check-match-card"><strong>{currentMatch.player1Name} × {currentMatch.player2Name}</strong><span><Clock3 className="w-3.5 h-3.5" /> {currentMatch.date} · {currentMatch.startTime}</span></div>
            <div className="qp-check-steps">
              <span className="is-done">1. A mostra</span><span className="is-done">2. B escaneia</span><span className={bothValidated ? 'is-done' : ''}>3. B mostra</span><span className={bothValidated ? 'is-done' : ''}>4. A escaneia</span>
            </div>

            {bothValidated && <div className="qp-check-success"><CheckCircle2 className="w-6 h-6" /><div><strong>PARTIDA VALIDADA</strong><span>Os dois jogadores confirmaram a presença.</span></div></div>}

            {mode === 'show' ? (
              <>
                <div className={`qp-qr-box ${seconds === 0 ? 'is-expired' : ''}`}>
                  {seconds > 0 ? <img src={qrUrl} alt="QR Code temporário para validação da partida" /> : <div className="qp-qr-expired"><QrCode className="w-10 h-10" /><strong>QR expirado</strong><span>Gere um novo código.</span></div>}
                </div>
                <div className="qp-qr-countdown"><span>Seu QR é válido por</span><strong>{seconds}s</strong></div>
                <p className="qp-check-hint">Mostre este QR ao adversário. Ele deve escanear o seu código. Depois, o adversário mostra o QR dele e você escaneia.</p>
                <div className="qp-check-actions">
                  <button type="button" onClick={regenerate} className="qp-check-primary"><QrCode className="w-4 h-4" /> Gerar novo QR</button>
                  {!bothValidated && <button type="button" onClick={() => { setScanMessage('Abra a Câmera do celular e aponte para o QR do adversário.'); setMode('scan'); }} className="qp-check-secondary"><Smartphone className="w-4 h-4" /> Ler QR com a câmera do celular</button>}
                </div>
                {scanMessage && <p className="qp-scanner__message">{scanMessage}</p>}
                <button type="button" onClick={() => void copyToken()} className="qp-check-copy">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Código copiado' : 'Copiar código de validação'}</button>
              </>
            ) : (
              <div className="qp-scanner">
                {!scanSuccess && <div className="qp-native-scan-card">
                  <div className="qp-native-scan-card__icon"><Smartphone className="w-8 h-8" /></div>
                  <strong>Use a câmera nativa do celular</strong>
                  <p>No iPhone ou Android, abra o aplicativo <b>Câmera</b> e aponte para o QR do adversário.</p>
                  <div className="qp-native-scan-card__steps">
                    <span><b>1</b> Abra a Câmera</span>
                    <span><b>2</b> Aponte para o QR</span>
                    <span><b>3</b> Toque no link do SAQUE ON</span>
                  </div>
                  <div className="qp-native-scan-card__note"><ExternalLink className="w-4 h-4" /> O link abre o SAQUE ON e valida automaticamente.</div>
                </div>}
                <div className="qp-scanner__title">{scanSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <QrCode className="w-5 h-5" />}<strong>{scanSuccess ? 'QR do adversário confirmado' : 'Aguardando leitura do QR'}</strong></div>
                {scanMessage && <p className="qp-scanner__message">{scanMessage}</p>}
                <button type="button" onClick={returnToMyQr} className="qp-check-primary w-full">{bothValidated ? 'Fechar validação' : 'Agora mostrar meu QR'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>;
};
