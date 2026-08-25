import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { PasswordSetupMode } from '../../lib/supabase';

interface PasswordResetViewProps {
  mode: Exclude<PasswordSetupMode, null>;
}

export const PasswordResetView: React.FC<PasswordResetViewProps> = ({ mode }) => {
  const { updatePassword, finishPasswordRecovery } = useAuth();
  const isInvite = mode === 'invite';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const save = async () => {
    if (password.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (password !== confirmation) return setError('As senhas não são iguais.');
    setSaving(true);
    setError(null);
    const result = await updatePassword(password);
    setSaving(false);
    if (!result.success) return setError(result.error || 'Não foi possível atualizar a senha.');
    setCompleted(true);
  };

  return (
    <div className="min-h-screen bg-[#eef1f8] flex items-center justify-center px-4 py-7">
      <div className="qp-shell w-full max-w-md rounded-[38px] border border-white p-5 sm:p-7">
        <div className="text-center pt-3 pb-7"><BrandLogo className="justify-center" /><p className="text-sm font-bold text-slate-500 mt-3">{isInvite ? 'Ative seu acesso com segurança.' : 'Recupere o acesso com segurança.'}</p></div>
        <section className="qp-card rounded-[30px] p-5">
          {completed ? <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-black text-[#0b1742] mt-3">{isInvite ? 'Conta ativada' : 'Senha atualizada'}</h2>
            <p className="text-xs text-slate-500 mt-2">{isInvite ? 'Entre usando seu e-mail e a senha criada.' : 'Entre novamente usando sua nova senha.'}</p>
            <button type="button" onClick={() => void finishPasswordRecovery()} className="qp-primary w-full rounded-[18px] py-3.5 mt-5 font-black text-sm flex items-center justify-center gap-1.5">Voltar para entrar <ChevronRight className="w-4 h-4" /></button>
          </div> : <>
            <h2 className="text-xl font-black text-[#0b1742]">{isInvite ? 'Criar senha de acesso' : 'Criar nova senha'}</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">Use pelo menos 8 caracteres.</p>
            {error && <div className="mb-4 p-3 rounded-[16px] bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">{error}</div>}
            <div className="space-y-3">
              <label className="block"><span className="text-[11px] font-black text-slate-500 ml-1">Nova senha</span><div className="relative mt-1.5"><Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full qp-soft rounded-[18px] pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-violet-200" /></div></label>
              <label className="block"><span className="text-[11px] font-black text-slate-500 ml-1">Confirmar nova senha</span><div className="relative mt-1.5"><Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full qp-soft rounded-[18px] pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-violet-200" /></div></label>
              <button type="button" disabled={saving} onClick={() => void save()} className="qp-primary w-full rounded-[18px] py-3.5 font-black text-sm disabled:opacity-60">{saving ? 'Salvando...' : (isInvite ? 'Criar senha' : 'Atualizar senha')}</button>
              <button type="button" disabled={saving} onClick={() => void finishPasswordRecovery()} className="w-full py-2 text-xs font-bold text-slate-500 disabled:opacity-50">Cancelar</button>
            </div>
          </>}
        </section>
      </div>
    </div>
  );
};
