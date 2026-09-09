import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Trophy, X } from 'lucide-react';
import { Match, MatchOutcome, MatchScoreSet } from '../../types';

interface Props {
  match: Match;
  isTennis: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (outcome: MatchOutcome, score: MatchScoreSet[]) => void;
}

const numberValue = (value: string) => Math.max(0, Number.parseInt(value || '0', 10) || 0);

export const MatchResultModal: React.FC<Props> = ({ match, isTennis, busy, onClose, onSubmit }) => {
  const [mode, setMode] = useState<'played' | 'unfinished'>('played');
  const [outcome, setOutcome] = useState<MatchOutcome>('not_played');
  const [scores, setScores] = useState<MatchScoreSet[]>(isTennis
    ? [{ player1: 0, player2: 0 }, { player1: 0, player2: 0 }, { player1: 0, player2: 0 }]
    : [{ player1: 0, player2: 0 }]);
  const [error, setError] = useState('');

  const options = useMemo(() => [
    { value: 'not_played', label: 'Jogo não aconteceu' },
    { value: 'walkover_player1', label: `W.O. com vitória de ${match.player1Name}` },
    { value: 'walkover_player2', label: `W.O. com vitória de ${match.player2Name}` },
    { value: 'double_walkover', label: 'W.O. duplo' },
    { value: 'retirement_player1', label: `Desistência com vitória de ${match.player1Name}` },
    { value: 'retirement_player2', label: `Desistência com vitória de ${match.player2Name}` },
    { value: 'interrupted', label: 'Jogo interrompido' },
    { value: 'reschedule', label: 'Remarcar partida' },
  ] as Array<{ value: MatchOutcome; label: string }>, [match]);

  const updateScore = (index: number, player: 'player1' | 'player2', value: string) => {
    setScores((current) => current.map((set, setIndex) => setIndex === index ? { ...set, [player]: numberValue(value) } : set));
  };

  const submit = () => {
    if (mode === 'played') {
      const usedScores = isTennis ? scores.filter((set) => set.player1 > 0 || set.player2 > 0) : scores;
      if (isTennis && (usedScores.length < 2 || usedScores.some((set) => set.player1 === set.player2))) {
        setError('Informe pelo menos dois sets, sem empate dentro do set.');
        return;
      }
      onSubmit('played', usedScores);
      return;
    }
    onSubmit(outcome, []);
  };

  return <div className="fixed inset-0 z-[200] bg-[#071633]/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Informar resultado">
    <div className="w-full max-w-lg max-h-[calc(100dvh-1.5rem)] rounded-[28px] bg-white shadow-2xl overflow-hidden flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Após o jogo</p><h3 className="text-xl font-black text-[#101b3d]">Informar resultado</h3></div>
        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center" aria-label="Fechar"><X className="w-5 h-5" /></button>
      </div>

      <div className="min-h-0 flex-1 p-5 overflow-y-auto overscroll-contain">
        <div className="rounded-2xl bg-slate-50 p-3 text-center text-sm font-black text-slate-800">{match.player1Name} <span className="text-slate-400">×</span> {match.player2Name}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setMode('played'); setError(''); }} className={`rounded-2xl p-3 text-xs font-black border ${mode === 'played' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500'}`}><Trophy className="w-5 h-5 mx-auto mb-1" />Jogo realizado</button>
          <button type="button" onClick={() => { setMode('unfinished'); setError(''); }} className={`rounded-2xl p-3 text-xs font-black border ${mode === 'unfinished' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-500'}`}><AlertTriangle className="w-5 h-5 mx-auto mb-1" />Não foi concluído</button>
        </div>

        {mode === 'played' ? <div className="mt-5">
          <div className="grid gap-2 items-center text-center" style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${scores.length}, 64px)` }}>
            <span />
            {scores.map((_, index) => <span key={index} className="text-[10px] font-black text-slate-400 uppercase">{isTennis ? `${index + 1}º set` : 'Placar'}</span>)}
            <span className="text-xs font-bold text-slate-700 truncate text-left">{match.player1Name}</span>
            {scores.map((set, index) => <input key={`p1-${index}`} type="number" inputMode="numeric" min="0" max="99" value={set.player1} onChange={(event) => updateScore(index, 'player1', event.target.value)} className="w-16 h-12 rounded-xl border border-slate-200 text-center text-lg font-black outline-none focus:border-blue-500" />)}
            <span className="text-xs font-bold text-slate-700 truncate text-left">{match.player2Name}</span>
            {scores.map((set, index) => <input key={`p2-${index}`} type="number" inputMode="numeric" min="0" max="99" value={set.player2} onChange={(event) => updateScore(index, 'player2', event.target.value)} className="w-16 h-12 rounded-xl border border-slate-200 text-center text-lg font-black outline-none focus:border-blue-500" />)}
          </div>
        </div> : <label className="block mt-5 text-xs font-black text-slate-600">Caso o jogo não tenha sido concluído, selecione a opção:
          <select value={outcome} onChange={(event) => setOutcome(event.target.value as MatchOutcome)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500">
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>}

        {error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
        <div className="mt-5 rounded-2xl bg-blue-50 p-3 text-[11px] font-bold text-blue-800">O adversário receberá uma solicitação para confirmar. Até lá, o registro ficará como aguardando confirmação.</div>
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white px-5 pt-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button type="button" disabled={busy} onClick={submit} className="w-full rounded-2xl bg-[#101b3d] py-3.5 text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"><CheckCircle2 className="w-5 h-5" />{busy ? 'Salvando...' : 'Enviar para confirmação'}</button>
      </div>
    </div>
  </div>;
};
