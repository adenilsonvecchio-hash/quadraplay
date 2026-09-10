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
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentMatch = useMemo(() => {
    const today = getBrasiliaToday();
    return matches
      .filter((m) => (m.status === 'scheduled' || m.status === 'pending') && (m.date >= today || !isSlotInPast(m.date, m.endTime)))
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0] || null;
  }, [matches]);

  const token = useMemo(() => currentMatch && currentUser ? encodePayload({
    v: 1,
    matchId: currentMatch.id,
    playerId: currentUser.id,
    issuedAt,
  }) : '', [currentMatch, currentUser, issuedAt]);

  const qrUrl = token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(token)}`
    : '';

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
        const Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          setScanMessage('Seu navegador não oferece leitura de QR pela câmera. Use o celular com Chrome/Android atualizado ou peça para o outro jogador apresentar o QR.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new Detector({ formats: ['qr_code'] });
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes?.[0]?.rawValue || '';
            if (raw) {
              const payload = decodePayload(raw);
              if (payload?.issuedAt && Date.now() - Number(payload.issuedAt) <= TOKEN_TTL_MS && payload.matchId) {
                setScanMessage('QR válido por 5 segundos. A partida foi identificada; prossiga para a confirmação no cartão de jogos.');
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                return;
              }
              setScanMessage('QR expirado. Peça ao jogador para gerar um novo código.');
            }
          } catch {
            // A câmera continua tentando sem interromper a tela.
          }
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
  }, [mode]);

  const regenerate = () => {
    setIssuedAt(Date.now());
    setSeconds(5);
    setScanMessage('');
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
        ) : mode === 'show' ? (
          <>
            <div className="qp-check-match-card"><strong>{currentMatch.player1Name} × {currentMatch.player2Name}</strong><span><Clock3 className="w-3.5 h-3.5" /> {currentMatch.date} · {currentMatch.startTime}</span></div>
            <div className={`qp-qr-box ${seconds === 0 ? 'is-expired' : ''}`}>
              {seconds > 0 ? <img src={qrUrl} alt="QR Code temporário para validação da partida" /> : <div className="qp-qr-expired"><QrCode className="w-10 h-10" /><strong>QR expirado</strong><span>Gere um novo código.</span></div>}
            </div>
            <div className="qp-qr-countdown"><span>Código válido por</span><strong>{seconds}s</strong></div>
            <p className="qp-check-hint">Mostre este QR ao outro jogador para ele escanear. O código muda e expira em 5 segundos.</p>
            <div className="qp-check-actions">
              <button type="button" onClick={regenerate} className="qp-check-primary"><QrCode className="w-4 h-4" /> Gerar novo QR</button>
              <button type="button" onClick={() => setMode('scan')} className="qp-check-secondary"><ScanLine className="w-4 h-4" /> Escanear adversário</button>
            </div>
            <button type="button" onClick={() => void copyToken()} className="qp-check-copy">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Código copiado' : 'Copiar código de validação'}</button>
          </>
        ) : (
          <div className="qp-scanner">
            <div className="qp-scanner__frame"><video ref={videoRef} playsInline muted /></div>
            <div className="qp-scanner__title"><Camera className="w-5 h-5" /><strong>Aponte para o QR do adversário</strong></div>
            {scanMessage && <p className="qp-scanner__message">{scanMessage}</p>}
            <button type="button" onClick={() => { setMode('show'); setScanMessage(''); }} className="qp-check-secondary w-full">Voltar para meu QR</button>
          </div>
        )}
      </div>
    </div>
  </div>;
};
