import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export const FirstAccessPasswordView: React.FC = () => {
  const { completeFirstAccess } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
    if (password !== confirmation) return setError('As senhas não são iguais.');
    setSaving(true); setError('');
    const result = await completeFirstAccess(password);
    setSaving(false);
    if (!result.success) setError(result.error || 'Não foi possível salvar a senha.');
  };
  return <div className="min-h-screen bg-[#eef1f8] flex items-center justify-center px-4 py-7"><div className="qp-shell w-full max-w-md rounded-[38px] border border-white p-5 sm:p-7"><div className="text-center pt-3 pb-7"><BrandLogo className="justify-center qp-standard-brand" /><p className="text-sm font-bold text-slate-500 mt-3">Proteja seu primeiro acesso.</p></div><section className="qp-card rounded-[30px] p-5"><h2 className="text-xl font-black text-[#0b1742]">Crie sua senha pessoal</h2><p className="text-xs text-slate-500 mt-1 mb-5">A senha provisória não poderá ser usada novamente.</p>{error && <div className="mb-4 p-3 rounded-[16px] bg-rose-50 text-rose-700 text-xs font-bold">{error}</div>}<div className="space-y-3"><PasswordField label="Nova senha" value={password} onChange={setPassword} /><PasswordField label="Confirmar senha" value={confirmation} onChange={setConfirmation} /><button type="button" disabled={saving} onClick={() => void save()} className="qp-primary w-full rounded-[18px] py-3.5 font-black text-sm disabled:opacity-60">{saving ? 'Salvando...' : 'Criar minha senha'}</button></div></section></div></div>;
};

const PasswordField: React.FC<{label:string;value:string;onChange:(value:string)=>void}> = ({ label, value, onChange }) => <label className="block"><span className="text-[11px] font-black text-slate-500 ml-1">{label}</span><div className="relative mt-1.5"><Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input type="password" value={value} onChange={(event) => onChange(event.target.value)} className="w-full qp-soft rounded-[18px] pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-violet-200" /></div></label>;
