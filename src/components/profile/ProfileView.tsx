import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { SUPABASE_SQL_SCHEMA } from '../../data/initialData';
import {
  User,
  Shield,
  LogOut,
  Sparkles,
  Database,
  CheckCircle2,
  Copy,
  ChevronRight,
  Info,
  RefreshCw,
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAdmin: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAdmin }) => {
  const { currentUser, logout, switchUser, allPlayers, isAdmin } = useAuth();
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showPlayerSwitcher, setShowPlayerSwitcher] = useState(false);

  if (!currentUser) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleResetData = () => {
    storageService.resetToDefaults();
    window.location.reload();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Perfil do Atleta</h2>
        <p className="text-xs text-slate-500">
          Suas informações no grupo Nosso Tênis
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F1E36] text-[#D4F63D] font-black text-xl flex items-center justify-center shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">{currentUser.name}</h3>
              {currentUser.isAdmin && (
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <p className="text-xs text-slate-500">{currentUser.phone}</p>
          </div>
        </div>

        {/* Class Badge & Restriction Note */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Categoria Atual
            </span>
            <span className="text-sm font-black text-slate-900">
              Classe {currentUser.tennisClass}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Classe gerida pelo Admin</span>
            </span>
          </div>
        </div>
      </div>

      {/* Admin Panel Access Button if Admin */}
      {isAdmin && (
        <button
          id="btn-profile-go-admin"
          onClick={onOpenAdmin}
          className="w-full py-3.5 px-4 bg-[#0F1E36] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Acessar Painel de Administração</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Switch Player (Demo / Testing helper) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          id="btn-profile-toggle-switcher"
          onClick={() => setShowPlayerSwitcher(!showPlayerSwitcher)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0F1E36]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Alternar Atleta (Demonstração)</p>
              <p className="text-[11px] text-slate-500">
                Simule qualquer um dos 50 atletas das 5 classes
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${
              showPlayerSwitcher ? 'rotate-90' : ''
            }`}
          />
        </button>

        {showPlayerSwitcher && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 max-h-60 overflow-y-auto space-y-1">
            {allPlayers.map((player) => (
              <button
                key={player.id}
                id={`btn-switch-to-${player.id}`}
                onClick={() => {
                  switchUser(player.id);
                  setShowPlayerSwitcher(false);
                }}
                className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                  player.id === currentUser.id
                    ? 'bg-[#0F1E36] text-white font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#D4F63D] text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {player.tennisClass}
                  </span>
                  <span>{player.name}</span>
                  {player.isAdmin && (
                    <span className="text-[9px] bg-amber-400/20 text-amber-600 px-1 py-0.2 rounded font-bold">
                      Admin
                    </span>
                  )}
                </div>
                {player.id === currentUser.id && (
                  <CheckCircle2 className="w-4 h-4 text-[#D4F63D]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Supabase Schema & Architecture view */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          id="btn-profile-view-supabase"
          onClick={() => setShowSqlModal(!showSqlModal)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Supabase & PostgreSQL</p>
              <p className="text-[11px] text-slate-500">
                Esquema SQL DDL, RLS e constraints de agendamento
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${
              showSqlModal ? 'rotate-90' : ''
            }`}
          />
        </button>

        {showSqlModal && (
          <div className="p-4 bg-slate-900 text-slate-300 border-t border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400">schema.sql (Supabase DDL & RLS)</span>
              <button
                id="btn-copy-supabase-sql"
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs flex items-center gap-1"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded-xl text-[11px] text-emerald-400 leading-relaxed custom-scrollbar">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}
      </div>

      {/* Reset Data to Initial Seed */}
      <button
        id="btn-reset-demo-data"
        onClick={handleResetData}
        className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Restaurar dados iniciais de fábrica</span>
      </button>

      {/* Logout */}
      <button
        id="btn-profile-logout"
        onClick={logout}
        className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Sair da Conta</span>
      </button>
    </div>
  );
};
