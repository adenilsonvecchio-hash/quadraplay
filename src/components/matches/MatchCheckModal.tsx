import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock3, Copy, QrCode, ScanLine, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { Match } from '../../types';
import { getBrasiliaToday, isSlotInPast } from '../../utils/dateUtils';

type Props = { onClose: () => void };
const TOKEN_TTL_MS = 5000;

const encodePayload = (payload: object) => {
  const text = JSON.stringify(payload);
  return `saqueon://check/${btoa(unescape(encodeURIComponent(text)))}`;
};

const decodePayload = (value: string) => {
  try {
    const encoded = value.includes('saqueon://check/') ? value.split('saqueon://check/')[1] : value;
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
};

export const MatchCheckModal: React.FC<Props> = ({ onClose }) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(5);
  const [issuedAt, setIssuedAt] = useState(() => Date.now());
  const [mode, setMode] = useState<'show' | 'scan'>('show');
  const [scanMessage, setScanMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adversaryValidated, setAdversaryValidated] = useState(false);
  const [bothValidated, setBothValidated] = useState(false);
  const [checking, setChecking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    setSeconds(5);
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

  useEffect(() => {
    if (mode !== 'scan') {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    const start = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setScanMessage('A câmera precisa ser usada em uma conexão segura (HTTPS). Abra o Saque ON pelo endereço oficial.');
          return;
        }

        // O BarcodeDetector nativo funciona bem em muitos Androids, mas o Safari/iPhone
        // ainda pode não expor essa API. A v111 usa o polyfill WASM como fallback.
        let Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          Detector = (window as any).barcodeDetectorPolyfill?.BarcodeDetectorPolyfill;
        }
        if (!Detector) {
          setScanMessage('Ativando o leitor compatível com iPhone… tente novamente em alguns segundos.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const detector = new Detector({ formats: ['qr_code'] });
        const scan = async () => {
          if (cancelled || !videoRef.current || checking || scanSuccess) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes?.[0]?.rawValue || '';
            if (raw) {
              const payload = decodePayload(raw);
              if (!payload?.issuedAt || !payload.matchId || !payload.playerId) {
                setScanMessage('QR Code inválido.');
              } else if (Date.now() - Number(payload.issuedAt) > TOKEN_TTL_MS) {
                setScanMessage('QR expirado. Peça ao jogador para gerar um novo código.');
              } else if (String(payload.matchId) !== String(currentMatch?.id)) {
                setScanMessage('Este QR pertence a outra partida.');
              } else if (String(payload.playerId) === String(currentUser?.id)) {
                setScanMessage('Você não pode validar seu próprio QR. Escaneie o QR do adversário.');
              } else {
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
                  stream.getTracks().forEach((track) => track.stop());
                  streamRef.current = null;
                } catch (error) {
                  setScanMessage(error instanceof Error ? error.message : 'Não foi possível validar esta partida.');
                } finally {
                  setChecking(false);
                }
                return;
              }
            }
          } catch { /* continua tentando */ }
          window.setTimeout(scan, 250);
        };
        void scan();
      } catch {
        setScanMessage('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
      }
    };
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [mode, currentMatch?.id, currentUser?.id, usingSupabase, checking, scanSuccess]);

  const regenerate = () => {
    setIssuedAt(Date.now());
    setSeconds(5);
    setScanMessage('');
    setScanSuccess(false);
  };

  const startScan = () => {
    setScanMessage('Aponte a câmera para o QR que o adversário está mostrando.');
    setScanSuccess(false);
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
                  {!bothValidated && <button type="button" onClick={startScan} className="qp-check-secondary"><ScanLine className="w-4 h-4" /> Escanear QR do adversário</button>}
                </div>
                {scanMessage && <p className="qp-scanner__message">{scanMessage}</p>}
                <button type="button" onClick={() => void copyToken()} className="qp-check-copy">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Código copiado' : 'Copiar código de validação'}</button>
              </>
            ) : (
              <div className="qp-scanner">
                {!scanSuccess && <div className="qp-scanner__frame"><video ref={videoRef} autoPlay playsInline muted /></div>}
                <div className="qp-scanner__title">{scanSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Camera className="w-5 h-5" />}<strong>{scanSuccess ? 'QR do adversário confirmado' : 'Aponte para o QR do adversário'}</strong></div>
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
