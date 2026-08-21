import { BlockedSlot, Court, CourtConfig, CourtSlot, Match, Player, TennisClass } from '../types';
import { supabase } from '../lib/supabase';
import { generateDaySlots, isSlotInPast } from '../utils/dateUtils';

const shortTime = (value: string | null | undefined) => (value || '').slice(0, 5);

const statusMap: Record<string, Match['status']> = {
  PENDENTE: 'pending',
  ACEITA: 'scheduled',
  CONCLUIDA: 'completed',
  CANCELADA: 'cancelled',
  RECUSADA: 'cancelled',
};

const mapMatch = (row: any): Match => ({
  id: row.id,
  player1Id: row.jogador_1_id,
  player1Name: row.jogador_1?.nome || 'Jogador 1',
  player2Id: row.jogador_2_id,
  player2Name: row.jogador_2?.nome || 'Jogador 2',
  tennisClass: row.classe as TennisClass,
  courtId: row.quadra_id,
  courtName: row.quadra?.nome || 'Quadra',
  date: row.data,
  startTime: shortTime(row.hora_inicio),
  endTime: shortTime(row.hora_fim),
  status: statusMap[row.status] || 'pending',
  createdAt: row.criado_em,
  cancelledAt: row.cancelado_em || undefined,
  cancelReason: row.motivo_cancelamento || undefined,
});

const matchSelect = `
  id, grupo_id, quadra_id, jogador_1_id, jogador_2_id, classe, data,
  hora_inicio, hora_fim, status, criado_em, cancelado_em, motivo_cancelamento,
  quadra:quadras!partidas_quadra_id_fkey(nome),
  jogador_1:perfis!partidas_jogador_1_id_fkey(nome),
  jogador_2:perfis!partidas_jogador_2_id_fkey(nome)
`;

export const supabaseAgendaService = {
  async getPlayersByClass(groupId: string, tennisClass: TennisClass, currentUserId: string): Promise<Player[]> {
    if (!supabase) return [];
    // Carrega primeiro os membros e depois os perfis. Esta forma não depende
    // do nome da relação que o PostgREST atribui à FK e funciona também em
    // bancos que já tinham a tabela antes da migração atual.
    const { data: members, error: membersError } = await supabase
      .from('membros_grupo')
      .select('usuario_id, classe, perfil')
      .eq('grupo_id', groupId)
      .eq('classe', tennisClass)
      .eq('aprovado', true)
      .neq('usuario_id', currentUserId);
    if (membersError) throw membersError;
    if (!members?.length) return [];

    const playerIds = members.map((member) => member.usuario_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('perfis')
      .select('id, nome, email, telefone, avatar_url, criado_em')
      .in('id', playerIds);
    if (profilesError) throw profilesError;

    const profilesById = new Map<string, {
      id: string;
      nome: string;
      email: string;
      telefone: string | null;
      avatar_url: string | null;
      criado_em: string;
    }>((profiles || []).map((profile: any) => [profile.id, profile]));
    return members.map((row: any) => {
      const profile = profilesById.get(row.usuario_id);
      return {
        id: row.usuario_id,
        name: profile?.nome?.trim() || 'Jogador sem nome',
        email: profile?.email || '',
        phone: profile?.telefone || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        tennisClass: row.classe as TennisClass,
        isAdmin: row.perfil === 'ADMINISTRADOR' || row.perfil === 'PROPRIETARIO',
        createdAt: profile?.criado_em || new Date().toISOString(),
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  async getCourts(groupId: string): Promise<Court[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('quadras').select('id, nome, piso, ativa, ordem').eq('grupo_id', groupId).order('ordem');
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, name: row.nome, surface: row.piso, active: row.ativa }));
  },

  async getConfig(groupId: string): Promise<CourtConfig | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('configuracoes_agenda').select('*').eq('grupo_id', groupId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const timeSlots = await this.getTimeSlots(groupId);
    return {
      courtName: 'Quadra 1',
      clubName: 'Tangará Country Clube',
      groupName: 'Nosso Tênis',
      slotDurationMinutes: data.duracao_minutos,
      openTime: shortTime(data.abre_as),
      closeTime: shortTime(data.fecha_as),
      activeDays: data.dias_ativos,
      maxAdvanceBookingDays: data.antecedencia_maxima_dias,
      timeSlots,
    };
  },

  async getTimeSlots(groupId: string): Promise<Array<{ startTime: string; endTime: string }>> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('horarios_agenda').select('hora_inicio, hora_fim').eq('grupo_id', groupId).eq('ativo', true).order('ordem');
    if (error) {
      if ((error as any).code === '42P01') return [];
      throw error;
    }
    return (data || []).map((row) => ({ startTime: shortTime(row.hora_inicio), endTime: shortTime(row.hora_fim) }));
  },

  async getBlockedSlots(groupId: string): Promise<BlockedSlot[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('bloqueios_agenda').select('*').eq('grupo_id', groupId).order('data').order('hora_inicio');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id, courtId: row.quadra_id || undefined, date: row.data,
      startTime: shortTime(row.hora_inicio) || undefined, endTime: shortTime(row.hora_fim) || undefined,
      allDay: row.dia_inteiro, reason: row.motivo, createdAt: row.criado_em,
    }));
  },

  async updateCourt(courtId: string, changes: Partial<Omit<Court, 'id'>>): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const payload: Record<string, unknown> = {};
    if (changes.name !== undefined) payload.nome = changes.name;
    if (changes.surface !== undefined) payload.piso = changes.surface;
    if (changes.active !== undefined) payload.ativa = changes.active;
    const { error } = await supabase.from('quadras').update(payload).eq('id', courtId);
    if (error) throw error;
  },

  async saveAdminConfig(groupId: string, config: CourtConfig): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error: configError } = await supabase.from('configuracoes_agenda').update({
      duracao_minutos: config.slotDurationMinutes,
      abre_as: config.openTime,
      fecha_as: config.closeTime,
      dias_ativos: config.activeDays,
      antecedencia_maxima_dias: config.maxAdvanceBookingDays,
      atualizado_em: new Date().toISOString(),
    }).eq('grupo_id', groupId);
    if (configError) throw configError;

    if (config.timeSlots) {
      const { error: deleteError } = await supabase.from('horarios_agenda').delete().eq('grupo_id', groupId);
      if (deleteError) throw deleteError;
      if (config.timeSlots.length) {
        const { error: insertError } = await supabase.from('horarios_agenda').insert(config.timeSlots.map((slot, index) => ({
          grupo_id: groupId, hora_inicio: slot.startTime, hora_fim: slot.endTime, ativo: true, ordem: index + 1,
        })));
        if (insertError) throw insertError;
      }
    }
  },

  async addBlockedSlot(groupId: string, userId: string, block: Omit<BlockedSlot, 'id' | 'createdAt'>): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('bloqueios_agenda').insert({
      grupo_id: groupId, quadra_id: block.courtId || null, data: block.date,
      hora_inicio: block.allDay ? null : block.startTime, hora_fim: block.allDay ? null : block.endTime,
      dia_inteiro: block.allDay, motivo: block.reason, criado_por: userId,
    });
    if (error) throw error;
  },

  async removeBlockedSlot(blockId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('bloqueios_agenda').delete().eq('id', blockId);
    if (error) throw error;
  },

  async getMatches(groupId: string): Promise<Match[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('partidas').select(matchSelect).eq('grupo_id', groupId).order('data').order('hora_inicio');
    if (error) throw error;
    return (data || []).map(mapMatch);
  },

  async createMatch(params: {
    groupId: string;
    courtId: string;
    player1Id: string;
    player2Id: string;
    tennisClass: TennisClass;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<Match> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.from('partidas').insert({
      grupo_id: params.groupId,
      quadra_id: params.courtId,
      jogador_1_id: params.player1Id,
      jogador_2_id: params.player2Id,
      classe: params.tennisClass,
      data: params.date,
      hora_inicio: params.startTime,
      hora_fim: params.endTime,
      status: 'PENDENTE',
    }).select(matchSelect).single();
    if (error) throw error;
    return mapMatch(data);
  },

  async respondToMatch(matchId: string, playerId: string, accept: boolean): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase
      .from('partidas')
      .update({
        status: accept ? 'ACEITA' : 'RECUSADA',
        ...(accept ? {} : {
          cancelado_por: playerId,
          motivo_cancelamento: 'Convite recusado pelo adversário',
          cancelado_em: new Date().toISOString(),
        }),
      })
      .eq('id', matchId)
      .eq('jogador_2_id', playerId)
      .eq('status', 'PENDENTE')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Este convite já foi respondido ou não pertence ao jogador.');
  },

  async cancelMatch(matchId: string, playerId: string, reason?: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase
      .from('partidas')
      .update({
        status: 'CANCELADA',
        cancelado_por: playerId,
        motivo_cancelamento: reason?.trim() || 'Cancelado pelo jogador',
        cancelado_em: new Date().toISOString(),
      })
      .eq('id', matchId)
      .in('status', ['PENDENTE', 'ACEITA'])
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Esta partida já foi alterada.');
  },

  async getSchedule(groupId: string, date: string, courtId: string): Promise<CourtSlot[]> {
    if (!supabase) return [];
    const [config, matchesResult, blocksResult] = await Promise.all([
      this.getConfig(groupId),
      supabase.from('partidas').select(matchSelect).eq('grupo_id', groupId).eq('quadra_id', courtId).eq('data', date).in('status', ['PENDENTE', 'ACEITA']),
      supabase.from('bloqueios_agenda').select('*').eq('grupo_id', groupId).eq('data', date),
    ]);
    if (matchesResult.error) throw matchesResult.error;
    if (blocksResult.error) throw blocksResult.error;
    const matches = (matchesResult.data || []).map(mapMatch);
    const blocks = (blocksResult.data || []).filter((block) => !block.quadra_id || block.quadra_id === courtId);
    const slots = config?.timeSlots?.length
      ? config.timeSlots
      : generateDaySlots(config?.openTime || '07:00', config?.closeTime || '17:30', config?.slotDurationMinutes || 90);

    return slots.map((slot) => {
      if (isSlotInPast(date, slot.startTime)) return { ...slot, available: false, blockReason: 'Horário já transcorrido' };
      const block = blocks.find((item) => item.dia_inteiro || (slot.startTime >= shortTime(item.hora_inicio) && slot.startTime < shortTime(item.hora_fim)));
      if (block) return { ...slot, available: false, isBlocked: true, blockReason: block.motivo };
      const match = matches.find((item) => item.startTime === slot.startTime);
      if (match) return { ...slot, available: false, match };
      return { ...slot, available: true };
    });
  },

  subscribeToMatches(groupId: string, onChange: () => void) {
    if (!supabase) return () => undefined;
    const channel = supabase.channel(`agenda-${groupId}`).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partidas', filter: `grupo_id=eq.${groupId}` },
      onChange,
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  },
};
