import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

interface LoginViewProps { onSuccess?: () => void; }

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { loginWithEmail, requestPasswordReset, allPlayers, usingSupabase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const login = async (userEmail: string, userPassword = password) => {
    setSubmitting(true);
    const res = await loginWithEmail(userEmail, userPassword);
    setSubmitting(false);
    if (!res.success) return setError(res.error || 'Credenciais inválidas.');
    setError(null);
    onSuccess?.();
  };

  const sendResetLink = async () => {
    if (!email.trim()) return setError('Informe seu e-mail para recuperar a senha.');
    setResetting(true);
    setError(null);
    setResetSent(false);
    const result = await requestPasswordReset(email);
    setResetting(false);
    if (!result.success) return setError(result.error || 'Não foi possível enviar o link.');
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-[#eef1f8] flex items-center justify-center px-4 py-7">
      <div className="qp-shell w-full max-w-md rounded-[38px] border border-white p-5 sm:p-7">
        <div className="text-center pt-3 pb-7">
          <BrandLogo className="justify-center" />
          <p className="text-sm font-bold text-slate-500 mt-3">Agende, desafie e jogue.</p>
        </div>

        <section className="qp-card rounded-[30px] p-5">
          <h2 className="text-xl font-black text-[#0b1742]">Entrar</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">Acesse sua conta para ver agenda, partidas e adversários.</p>

          {error && <div className="mb-4 p-3 rounded-[16px] bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">{error}</div>}
          {resetSent && <div className="mb-4 p-3 rounded-[16px] bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">Link enviado. Verifique sua caixa de entrada e o spam.</div>}

          <form onSubmit={(e) => { e.preventDefault(); if (!email.trim()) return setError('Informe seu e-mail.'); void login(email); }} className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-black text-slate-500 ml-1">E-mail</span>
              <div className="relative mt-1.5"><Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} placeholder="seu@email.com" className="w-full qp-soft rounded-[18px] pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-violet-200" /></div>
            </label>
            <label className="block">
              <span className="text-[11px] font-black text-slate-500 ml-1">Senha</span>
              <div className="relative mt-1.5"><Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full qp-soft rounded-[18px] pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-violet-200" /></div>
            </label>
            {usingSupabase && <button type="button" disabled={resetting} onClick={() => void sendResetLink()} className="w-full text-right pr-1 text-[11px] font-black text-violet-600 hover:text-violet-700 disabled:opacity-50">{resetting ? 'Enviando link...' : 'Esqueci minha senha'}</button>}
            <button type="submit" disabled={submitting} className="qp-primary w-full rounded-[18px] py-3.5 font-black text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">{submitting ? 'Entrando...' : 'Entrar no QuadraPlay'} <ChevronRight className="w-4 h-4" /></button>
          </form>

          {!usingSupabase && <button type="button" onClick={() => setShowDemoSelector(v => !v)} className="w-full mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-violet-600 flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />{showDemoSelector ? 'Ocultar jogadores de demonstração' : 'Entrar com jogador de demonstração'}</button>}

          {!usingSupabase && showDemoSelector && <div className="mt-3 max-h-52 overflow-y-auto custom-scrollbar space-y-1.5">{allPlayers.map(player => <button key={player.id} onClick={() => void login(player.email, 'senha123')} className="w-full qp-soft rounded-[15px] px-3 py-2.5 flex items-center gap-2 text-left"><span className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 grid place-items-center text-xs font-black">{player.level}</span><span className="flex-1 min-w-0 text-xs font-black truncate">{player.name}</span>{player.isAdmin && <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-1 rounded-lg">ADMIN</span>}</button>)}</div>}
        </section>

        <div className="mt-5 text-center text-[10px] text-slate-400"><p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Agende sua quadra em segundos</p></div>
      </div>
    </div>
  );
};
