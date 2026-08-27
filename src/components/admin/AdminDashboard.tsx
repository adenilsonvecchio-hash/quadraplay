import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Player, Match, BlockedSlot, CourtConfig, TennisClass, Court } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { formatFriendlyDate, getBrasiliaToday } from '../../utils/dateUtils';
import {
  Users,
  Calendar,
  Shield,
  Clock,
  Plus,
  Edit2,
  Trash2,
  XCircle,
  Check,
  AlertTriangle,
  Lock,
  Settings,
  ArrowLeft,
  X,
  Copy,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'players' | 'matches' | 'blocks' | 'config';

const safeInitialConfig: CourtConfig = {
  courtName: 'Quadra 1',
  clubName: 'Nosso Tênis',
  groupName: 'Nosso Tênis',
  slotDurationMinutes: 90,
  openTime: '07:00',
  closeTime: '17:30',
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  maxAdvanceBookingDays: 30,
  timeSlots: [],
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('players');

  // State
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [courtConfig, setCourtConfig] = useState<CourtConfig>(safeInitialConfig);
  const [courts, setCourts] = useState<Court[]>([]);
  const [configSaved, setConfigSaved] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(true);

  // Player Form Modal State
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerClass, setPlayerClass] = useState<TennisClass>('A');
  const [playerIsAdmin, setPlayerIsAdmin] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerSuccess, setPlayerSuccess] = useState<string | null>(null);
  const [playerSaving, setPlayerSaving] = useState(false);
  const [accessCredentials, setAccessCredentials] = useState<{ email: string; password: string } | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(getBrasiliaToday());
  const [blockCourtId, setBlockCourtId] = useState('court-1');
  const [blockStartTime, setBlockStartTime] = useState('08:00');
  const [blockEndTime, setBlockEndTime] = useState('12:00');
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockReason, setBlockReason] = useState('Manutenção preventiva da quadra');

  // Cancellation Modal
  const [cancellingMatch, setCancellingMatch] = useState<Match | null>(null);

  // Deletion Modal
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Filter state for matches
  const [matchClassFilter, setMatchClassFilter] = useState<TennisClass | 'ALL'>('ALL');

  const loadAll = async () => {
    setAdminLoading(true);
    try {
      setAdminError('');
      if (usingSupabase && groupId) {
        const results = await Promise.allSettled([
          supabaseAgendaService.getGroupPlayers(groupId), supabaseAgendaService.getMatches(groupId),
          supabaseAgendaService.getBlockedSlots(groupId), supabaseAgendaService.getConfig(groupId),
          supabaseAgendaService.getCourts(groupId),
        ]);
        const [playersResult, matchesResult, blocksResult, configResult, courtsResult] = results;

        if (playersResult.status === 'fulfilled') setPlayers(Array.isArray(playersResult.value) ? playersResult.value : []);
        if (matchesResult.status === 'fulfilled') setMatches(Array.isArray(matchesResult.value) ? matchesResult.value : []);
        if (blocksResult.status === 'fulfilled') setBlockedSlots(Array.isArray(blocksResult.value) ? blocksResult.value : []);
        if (courtsResult.status === 'fulfilled') setCourts(Array.isArray(courtsResult.value) ? courtsResult.value : []);
        if (configResult.status === 'fulfilled' && configResult.value) setCourtConfig({ ...safeInitialConfig, ...configResult.value });

        const failedSections = results.filter((result) => result.status === 'rejected').length;
        if (failedSections) setAdminError(`${failedSections} seção(ões) não puderam ser carregadas. As demais continuam disponíveis.`);
      } else {
        setPlayers(storageService.getPlayers());
        setMatches(storageService.getMatches()); setBlockedSlots(storageService.getBlockedSlots());
        setCourtConfig(storageService.getConfig()); setCourts(storageService.getCourts(false));
      }
    } catch {
      setAdminError('Não foi possível carregar as configurações administrativas do banco.');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void loadAll());
    return storageService.subscribe(() => void loadAll());
  }, [usingSupabase, groupId]);

  // Player Management
  const handleOpenNewPlayer = () => {
    setEditingPlayer(null);
    setPlayerName('');
    setPlayerEmail('');
    setPlayerPhone('');
    setPlayerClass('A');
    setPlayerIsAdmin(false);
    setPlayerError(null);
    setPlayerSuccess(null);
    setAccessCredentials(null);
    setCredentialsCopied(false);
    setIsPlayerModalOpen(true);
  };

  const handleOpenEditPlayer = (p: Player) => {
    setEditingPlayer(p);
    setPlayerName(p.name);
    setPlayerEmail(p.email);
    setPlayerPhone(p.phone || '');
    setPlayerClass(p.tennisClass);
    setPlayerIsAdmin(p.isAdmin);
    setPlayerError(null);
    setPlayerSuccess(null);
    setAccessCredentials(null);
    setCredentialsCopied(false);
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !playerEmail.trim()) {
      setPlayerError('Nome e E-mail são obrigatórios.');
      return;
    }

    setPlayerSaving(true);
    setPlayerError(null);
    try {
      const payload = {
        name: playerName.trim(),
        email: playerEmail.trim(),
        phone: playerPhone.trim() || undefined,
        tennisClass: playerClass,
        isAdmin: playerIsAdmin,
      };
      if (usingSupabase && groupId) {
        if (editingPlayer) await supabaseAgendaService.updateGroupPlayer(groupId, editingPlayer.id, payload);
        else {
          const result = await supabaseAgendaService.addGroupPlayer(groupId, payload);
          if (result.status === 'created' && result.temporaryPassword) {
            setAccessCredentials({ email: payload.email, password: result.temporaryPassword });
            setPlayerSuccess('Conta criada e aprovada sem envio de e-mail. Copie os dados de acesso.');
          } else setPlayerSuccess(`A conta ${payload.email} já existia e foi vinculada ao grupo.`);
        }
      } else {
        storageService.savePlayer({ id: editingPlayer?.id, ...payload });
        if (!editingPlayer) setPlayerSuccess('Jogador cadastrado com sucesso.');
      }
      if (editingPlayer || !usingSupabase) setIsPlayerModalOpen(false);
      await loadAll();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Não foi possível salvar o jogador.';
      const edgeFunctionUnavailable = !editingPlayer && (
        message.includes('admin-invite-player')
        || message.includes('Failed to send a request')
        || message.includes('Failed to fetch')
        || message.includes('FunctionsFetchError')
        || message.includes('FunctionsHttpError')
        || message.includes('Edge Function returned')
        || message.includes('Function not found')
        || message.includes('NOT_FOUND')
      );
      setPlayerError(edgeFunctionUnavailable
        ? 'Publique a função admin-invite-player no Supabase antes de convidar jogadores.'
        : message.includes('admin_adicionar_jogador') || message.includes('admin_atualizar_jogador')
        ? 'Execute a migração 003 no Supabase antes de gerenciar jogadores.'
        : message);
    } finally {
      setPlayerSaving(false);
    }
  };

  const copyAccessCredentials = async () => {
    if (!accessCredentials) return;
    const message = `QuadraPlay\nAcesso: ${accessCredentials.email}\nSenha provisória: ${accessCredentials.password}\nNo primeiro acesso, crie sua senha pessoal.`;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCredentialsCopied(copied);
    if (copied) window.setTimeout(() => setCredentialsCopied(false), 2500);
  };

  const handleConfirmDeletePlayer = async () => {
    if (!deletingPlayer) return;
    if (deletingPlayer.id === currentUser?.id) {
      setDeleteError('Você não pode remover sua própria conta administrativa.');
      return;
    }
    setDeleteSaving(true);
    try {
      if (usingSupabase && groupId) await supabaseAgendaService.removeGroupPlayer(groupId, deletingPlayer.id);
      else {
        const result = storageService.deletePlayer(deletingPlayer.id);
        if (!result.success) throw new Error(result.message || 'Não foi possível excluir.');
      }
      setDeletingPlayer(null);
      setDeleteError(null);
      await loadAll();
    } catch (removeError) {
      const message = removeError instanceof Error ? removeError.message : 'Não foi possível excluir.';
      setDeleteError(message.includes('admin_remover_jogador')
        ? 'Execute a migração 003 no Supabase antes de excluir jogadores.'
        : message);
    } finally {
      setDeleteSaving(false);
    }
  };

  // Match Cancellation
  const handleConfirmCancelMatch = async (reason?: string) => {
    if (!cancellingMatch || !currentUser) return;
    try {
      if (usingSupabase) await supabaseAgendaService.cancelMatch(cancellingMatch.id, currentUser.id, reason || 'Cancelado pela Administração do Clube');
      else storageService.cancelMatch(cancellingMatch.id, `Admin (${currentUser.name})`, reason || 'Cancelado pela Administração do Clube');
      setCancellingMatch(null); await loadAll();
    } catch { setAdminError('Não foi possível cancelar esta partida.'); }
  };

  // Blocked Slots Management
  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockReason.trim()) return;

    const block = {
      courtId: blockCourtId || undefined,
      date: blockDate,
      startTime: blockAllDay ? undefined : blockStartTime,
      endTime: blockAllDay ? undefined : blockEndTime,
      allDay: blockAllDay,
      reason: blockReason.trim(),
    };
    try {
      if (usingSupabase && groupId && currentUser) await supabaseAgendaService.addBlockedSlot(groupId, currentUser.id, block);
      else storageService.addBlockedSlot(block);
      setIsBlockModalOpen(false); await loadAll();
    } catch { setAdminError('Não foi possível criar o bloqueio.'); }
  };

  const handleRemoveBlock = async (id: string) => {
    try {
      if (usingSupabase) await supabaseAgendaService.removeBlockedSlot(id);
      else storageService.removeBlockedSlot(id);
      await loadAll();
    } catch { setAdminError('Não foi possível remover o bloqueio.'); }
  };

  // Config Update
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (usingSupabase && groupId) await supabaseAgendaService.saveAdminConfig(groupId, courtConfig);
      else storageService.updateConfig(courtConfig);
      setConfigSaved(true); setAdminError(''); await loadAll();
    } catch { setAdminError('Execute primeiro a migração 002 de horários no Supabase e tente novamente.'); }
    window.setTimeout(() => setConfigSaved(false), 2500);
  };

  const saveCourt = async (court: Court, changes: Partial<Omit<Court, 'id'>>) => {
    const updated = { ...court, ...changes };
    setCourts((items) => items.map((item) => item.id === court.id ? updated : item));
    try {
      if (usingSupabase) await supabaseAgendaService.updateCourt(court.id, changes);
      else storageService.updateCourt(court.id, changes);
      setAdminError('');
    } catch { setAdminError('Não foi possível atualizar a quadra.'); await loadAll(); }
  };

  const updateSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const timeSlots = [...(courtConfig.timeSlots || [])];
    timeSlots[index] = { ...timeSlots[index], [field]: value };
    setCourtConfig({ ...courtConfig, timeSlots });
  };

  const addTimeSlot = () => setCourtConfig({
    ...courtConfig,
    timeSlots: [...(courtConfig.timeSlots || []), { startTime: '07:00', endTime: '08:30' }],
  });

  const removeTimeSlot = (index: number) => setCourtConfig({
    ...courtConfig,
    timeSlots: (courtConfig.timeSlots || []).filter((_, itemIndex) => itemIndex !== index),
  });

  const filteredMatches = (Array.isArray(matches) ? matches : []).filter((m) => {
    if (matchClassFilter === 'ALL') return true;
    return m.tennisClass === matchClassFilter;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="bg-gradient-to-br from-white via-[#f7f5ff] to-[#eef7ff] text-[#101b3d] rounded-3xl p-5 border border-white shadow-[0_12px_34px_rgba(91,70,238,0.10)]">
        <div className="flex items-center justify-between">
          <button
            id="btn-admin-back"
            onClick={onBack}
            className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1.5 p-1.5 -ml-1.5 rounded-lg hover:bg-violet-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao App</span>
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
            Painel Administrativo
          </span>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-black">Gestão do Nosso Tênis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de Atletas, Agendamentos e Horários
          </p>
        </div>
      </div>

      {adminError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">
          {adminError}
        </div>
      )}

      {adminLoading && (
        <div className="rounded-2xl bg-violet-50 border border-violet-100 p-3 text-xs font-bold text-violet-700">
          Carregando dados administrativos...
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-black">
        <button
          id="admin-tab-players"
          onClick={() => setActiveTab('players')}
          className={`py-2 px-1 rounded-xl transition-all ${
            activeTab === 'players'
              ? 'bg-violet-100 text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Jogadores ({players.length})
        </button>
        <button
          id="admin-tab-matches"
          onClick={() => setActiveTab('matches')}
          className={`py-2 px-1 rounded-xl transition-all ${
            activeTab === 'matches'
              ? 'bg-violet-100 text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Agenda
        </button>
        <button
          id="admin-tab-blocks"
          onClick={() => setActiveTab('blocks')}
          className={`py-2 px-1 rounded-xl transition-all ${
            activeTab === 'blocks'
              ? 'bg-violet-100 text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Bloqueios
        </button>
        <button
          id="admin-tab-config"
          onClick={() => setActiveTab('config')}
          className={`py-2 px-1 rounded-xl transition-all ${
            activeTab === 'config'
              ? 'bg-violet-100 text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Config
        </button>
      </div>

      {/* TAB 1: JOGADORES */}
      {activeTab === 'players' && (
        <div className="space-y-3">
          {playerSuccess && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <span>{playerSuccess}</span>
              <button type="button" onClick={() => setPlayerSuccess(null)} className="shrink-0 text-emerald-600 hover:text-emerald-900" aria-label="Fechar confirmação">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {players.length} de 50 atletas cadastrados
            </span>
            <button
              id="btn-admin-add-player"
              onClick={handleOpenNewPlayer}
              className="text-xs font-black bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Jogador</span>
            </button>
          </div>

          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0b1742] font-black text-sm flex items-center justify-center border border-slate-200">
                    {player.tennisClass}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-slate-900">{player.name}</p>
                      {player.isAdmin && (
                        <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{player.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    id={`btn-edit-player-${player.id}`}
                    onClick={() => handleOpenEditPlayer(player)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Editar jogador e classe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-delete-player-${player.id}`}
                    onClick={() => {
                      setDeletingPlayer(player);
                      setDeleteError(null);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Excluir jogador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AGENDAMENTOS (AGENDA COMPLETA) */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {/* Class Filter */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-600 shrink-0">Filtrar:</span>
            {(['ALL', 'A', 'B', 'C', 'D', 'E'] as const).map((cls) => (
              <button
                key={cls}
                id={`btn-admin-match-filter-${cls}`}
                onClick={() => setMatchClassFilter(cls)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  matchClassFilter === cls
                    ? 'bg-violet-100 text-violet-700 border border-violet-200'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cls === 'ALL' ? 'Todas as Classes' : `Classe ${cls}`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredMatches.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Nenhum agendamento encontrado para este filtro.
              </div>
            ) : (
              filteredMatches.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                        Classe {m.tennisClass}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          m.status === 'scheduled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : m.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.status === 'scheduled'
                          ? 'Agendado'
                          : m.status === 'cancelled'
                          ? 'Cancelado'
                          : 'Concluído'}
                      </span>
                    </div>

                    {m.status === 'scheduled' && (
                      <button
                        id={`btn-admin-cancel-match-${m.id}`}
                        onClick={() => setCancellingMatch(m)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-slate-900 text-sm">
                        {m.player1Name} <span className="font-normal text-slate-400">vs</span>{' '}
                        {m.player2Name}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {formatFriendlyDate(m.date)} • {m.startTime} às {m.endTime}
                      </p>
                    </div>
                  </div>

                  {m.cancelReason && (
                    <p className="text-[11px] text-rose-600 italic pt-1 border-t border-slate-100">
                      Motivo: {m.cancelReason}{m.cancelledBy ? ` • por ${m.cancelledBy}` : ''}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BLOQUEIOS DE QUADRA */}
      {activeTab === 'blocks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Bloqueios por chuva, manutenção ou torneios
            </span>
            <button
              id="btn-admin-add-block"
              onClick={() => setIsBlockModalOpen(true)}
              className="text-xs font-black bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Bloqueio</span>
            </button>
          </div>

          <div className="space-y-2">
            {blockedSlots.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Nenhum bloqueio de data ou horário ativo no momento.
              </div>
            ) : (
              blockedSlots.map((b) => (
                <div
                  key={b.id}
                  className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-950">
                        {formatFriendlyDate(b.date)}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                        {b.allDay ? 'Dia Inteiro' : `${b.startTime} às ${b.endTime}`}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-900 mt-1">{b.reason}</p>
                    <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                      {b.courtId ? courts.find((court) => court.id === b.courtId)?.name : 'Todas as quadras'}
                    </p>
                  </div>

                  <button
                    id={`btn-remove-block-${b.id}`}
                    onClick={() => void handleRemoveBlock(b.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Remover bloqueio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURAÇÕES DA QUADRA */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Horários & Regras da Quadra
          </h3>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Quadras cadastradas</label>
            {courts.map((court) => (
              <div key={court.id} className="grid grid-cols-[1fr_92px_auto] gap-2 items-center rounded-2xl bg-slate-50 p-2.5 border border-slate-200">
                <input
                  value={court.name}
                  onChange={(event) => setCourts((items) => items.map((item) => item.id === court.id ? { ...item, name: event.target.value } : item))}
                  onBlur={(event) => void saveCourt(court, { name: event.target.value.trim() || court.name })}
                  className="min-w-0 text-xs font-bold p-2 rounded-xl border border-slate-200"
                  aria-label={`Nome da ${court.name}`}
                />
                <select
                  value={court.surface}
                  onChange={(event) => void saveCourt(court, { surface: event.target.value })}
                  className="text-[11px] font-semibold p-2 rounded-xl border border-slate-200"
                >
                  <option>Saibro</option>
                  <option>Rápida</option>
                  <option>Grama</option>
                </select>
                <button
                  type="button"
                  onClick={() => void saveCourt(court, { active: !court.active })}
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-black ${court.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                >
                  {court.active ? 'Liberada' : 'Bloqueada'}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Horários disponíveis</label>
              <button type="button" onClick={addTimeSlot} className="text-[10px] font-black text-violet-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Adicionar horário
              </button>
            </div>
            {(courtConfig.timeSlots || []).map((slot, index) => (
              <div key={`${index}-${slot.startTime}`} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                <input type="time" value={slot.startTime} onChange={(event) => updateSlot(index, 'startTime', event.target.value)} className="text-xs font-semibold p-2.5 rounded-xl border border-slate-200" />
                <span className="text-xs text-slate-400">até</span>
                <input type="time" value={slot.endTime} onChange={(event) => updateSlot(index, 'endTime', event.target.value)} className="text-xs font-semibold p-2.5 rounded-xl border border-slate-200" />
                <button type="button" onClick={() => removeTimeSlot(index)} className="p-2 text-rose-600" aria-label="Excluir horário"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Abertura</label>
              <input
                id="input-config-open-time"
                type="time"
                value={courtConfig.openTime}
                onChange={(e) => setCourtConfig({ ...courtConfig, openTime: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Fechamento</label>
              <input
                id="input-config-close-time"
                type="time"
                value={courtConfig.closeTime}
                onChange={(e) => setCourtConfig({ ...courtConfig, closeTime: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duração do Slot (min)</label>
              <select
                id="select-config-duration"
                value={courtConfig.slotDurationMinutes}
                onChange={(e) => setCourtConfig({ ...courtConfig, slotDurationMinutes: Number(e.target.value) })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
              >
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1h 30m)</option>
                <option value={120}>120 minutos (2 horas)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Antecedência Máx. (dias)</label>
              <input
                id="input-config-advance-days"
                type="number"
                min={1}
                max={60}
                value={courtConfig.maxAdvanceBookingDays}
                onChange={(e) => setCourtConfig({ ...courtConfig, maxAdvanceBookingDays: Number(e.target.value) })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <button
            id="btn-save-court-config"
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#765fff] to-[#5d45ed] hover:from-[#6d55f7] hover:to-[#553de2] text-white font-bold text-xs rounded-xl shadow-[0_8px_20px_rgba(93,69,237,0.22)] transition-colors"
          >
            Salvar Configurações da Quadra
          </button>
          {configSaved && <p className="text-center text-xs font-black text-emerald-700">Configurações salvas com sucesso.</p>}
        </form>
      )}

      {/* PLAYER MODAL (Create/Edit) */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setIsPlayerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              {editingPlayer ? 'Editar Atleta' : 'Novo Atleta'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingPlayer
                ? 'Atualize os dados e a classe do jogador no grupo.'
                : 'Informe os dados. O QuadraPlay criará e aprovará a conta sem enviar e-mail.'}
            </p>

            {playerError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {playerError}
              </div>
            )}

            {accessCredentials && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-800">Acesso provisório criado</p>
              <p className="mt-2 text-[11px] text-emerald-700">E-mail</p><p className="text-sm font-black break-all">{accessCredentials.email}</p>
              <p className="mt-2 text-[11px] text-emerald-700">Senha provisória</p><p className="text-lg font-black tracking-wider">{accessCredentials.password}</p>
              <button type="button" onClick={() => void copyAccessCredentials()} className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white flex items-center justify-center gap-1.5"><Copy className="w-4 h-4" />{credentialsCopied ? 'Copiado!' : 'Copiar para enviar no WhatsApp'}</button>
              <p className="mt-2 text-[10px] font-bold text-emerald-700">O jogador deverá criar uma senha pessoal no primeiro acesso.</p>
            </div>}

            {!accessCredentials && <form onSubmit={handleSavePlayer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  id="input-player-name"
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ex: Carlos Mendes"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  id="input-player-email"
                  type="email"
                  required
                  disabled={!!editingPlayer && usingSupabase}
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  placeholder="nome@nossotenis.com.br"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                <input
                  id="input-player-phone"
                  type="text"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value)}
                  placeholder="(11) 98123-4567"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Classe do Jogador</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['A', 'B', 'C', 'D', 'E'] as TennisClass[]).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setPlayerClass(cls)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        playerClass === cls
                          ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-player-admin"
                  type="checkbox"
                  checked={playerIsAdmin}
                  onChange={(e) => setPlayerIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="checkbox-player-admin" className="text-xs font-bold text-slate-800">
                  Perfil de Administrador
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-player-submit"
                  type="submit"
                  disabled={playerSaving}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm disabled:opacity-60"
                >
                  {playerSaving
                    ? (editingPlayer ? 'Salvando...' : 'Criando acesso...')
                    : (editingPlayer ? 'Salvar' : 'Convidar e salvar')}
                </button>
              </div>
            </form>}
          </div>
        </div>
      )}

      {/* BLOCK MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setIsBlockModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">Bloquear Quadra</h3>
            <p className="text-xs text-slate-500 mb-4">
              Impeça reservas em datas ou horários específicos.
            </p>

            <form onSubmit={handleSaveBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quadra</label>
                <select
                  value={blockCourtId}
                  onChange={(event) => setBlockCourtId(event.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="">Todas as quadras</option>
                  {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="chk-all-day"
                  type="checkbox"
                  checked={blockAllDay}
                  onChange={(e) => setBlockAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <label htmlFor="chk-all-day" className="text-xs font-bold text-slate-800">
                  Bloquear dia inteiro
                </label>
              </div>

              {!blockAllDay && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Início</label>
                    <input
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fim</label>
                    <input
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Bloqueio</label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Torneio Interno, Chuva, Manutenção"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATCH CANCELLATION MODAL */}
      <ConfirmModal
        isOpen={!!cancellingMatch}
        title="Cancelar agendamento (Admin)?"
        description={
          cancellingMatch
            ? `Tem certeza que deseja cancelar o jogo entre ${cancellingMatch.player1Name} e ${cancellingMatch.player2Name} em ${formatFriendlyDate(cancellingMatch.date)} às ${cancellingMatch.startTime}?`
            : ''
        }
        confirmLabel="Sim, Cancelar Jogo"
        cancelLabel="Voltar"
        isDestructive={true}
        showReasonInput={true}
        onConfirm={handleConfirmCancelMatch}
        onClose={() => setCancellingMatch(null)}
      />

      {/* PLAYER DELETION MODAL */}
      <ConfirmModal
        isOpen={!!deletingPlayer}
        title="Excluir atleta?"
        description={
          deleteError
            ? deleteError
            : deletingPlayer
            ? `Deseja realmente remover o jogador ${deletingPlayer.name} da Classe ${deletingPlayer.tennisClass}? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel={deleteSaving ? 'Excluindo...' : 'Excluir Jogador'}
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDeletePlayer}
        onClose={() => {
          setDeletingPlayer(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
};
