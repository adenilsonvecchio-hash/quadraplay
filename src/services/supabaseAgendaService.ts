import { Court, CourtConfig, CourtSlot, Match, TennisClass } from '../types';
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
    return {
      courtName: 'Quadra 1',
      clubName: 'Tangará Country Clube',
      groupName: 'Nosso Tênis',
      slotDurationMinutes: data.duracao_minutos,
      openTime: shortTime(data.abre_as),
      closeTime: shortTime(data.fecha_as),
      activeDays: data.dias_ativos,
      maxAdvanceBookingDays: data.antecedencia_maxima_dias,
    };
  },

  async getMatches(groupId: string): Promise<Match[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('partidas').select(matchSelect).eq('grupo_id', groupId).order('data').order('hora_inicio');
    if (error) throw error;
    return (data || []).map(mapMatch);
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
    const slots = generateDaySlots(config?.openTime || '07:00', config?.closeTime || '17:30', config?.slotDurationMinutes || 90);

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
