import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { loginWithEmail, allPlayers } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    const res = loginWithEmail(email, password);
    if (res.success) {
      setError(null);
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Credenciais inválidas.');
    }
  };

  const handleSelectDemoPlayer = (playerEmail: string) => {
    setEmail(playerEmail);
    setPassword('senha123');
    const res = loginWithEmail(playerEmail, 'senha123');
    if (res.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1E36] text-white flex flex-col justify-between px-5 py-8 max-w-md mx-auto">
      {/* Top Header & Branding */}
      <div className="pt-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D4F63D] text-slate-950 font-black text-2xl shadow-xl shadow-lime-950/40 mb-4 border-2 border-lime-300">
          QP
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">QuadraPlay</h1>
        <p className="text-xs font-semibold text-lime-400 mt-1 uppercase tracking-wider">
          Nosso Tênis • Tangará Country Clube
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
          Agendamento oficial da quadra de saibro exclusiva para o grupo.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md my-6">
        <h2 className="text-lg font-bold text-white mb-1">Acessar Conta</h2>
        <p className="text-xs text-slate-400 mb-5">
          Entre com seu e-mail cadastrado pelo clube.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="seu.nome@tangara.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4F63D] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4F63D] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full py-3.5 px-4 bg-[#D4F63D] hover:bg-[#c6ea2f] text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-lime-950/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>Entrar no QuadraPlay</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        {/* Demo Fast Access Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            id="btn-toggle-demo-accounts"
            type="button"
            onClick={() => setShowDemoSelector(!showDemoSelector)}
            className="text-xs text-[#D4F63D] hover:underline font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showDemoSelector ? 'Ocultar contas de demonstração' : 'Acessar com 1 clique (50 jogadores)'}</span>
          </button>
        </div>

        {showDemoSelector && (
          <div className="mt-4 max-h-56 overflow-y-auto space-y-1.5 pr-1 text-left custom-scrollbar">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Selecione um jogador teste:
            </p>
            {allPlayers.map((player) => (
              <button
                key={player.id}
                id={`btn-demo-player-${player.id}`}
                type="button"
                onClick={() => handleSelectDemoPlayer(player.email)}
                className="w-full p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#D4F63D] text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {player.tennisClass}
                  </span>
                  <span className="font-semibold text-slate-200">{player.name}</span>
                  {player.isAdmin && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">{player.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-slate-500 text-[11px] space-y-1">
        <p className="flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quadra única • 5 Classes (A, B, C, D, E) • 50 Atletas</span>
        </p>
        <p>Tangará Country Clube — Nosso Tênis</p>
      </div>
    </div>
  );
};
