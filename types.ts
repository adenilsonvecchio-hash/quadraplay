// Nível de habilidade do jogador dentro de um grupo/esporte.
// Antes era travado em 'A'..'E' (só tênis). Agora é livre para caber em
// qualquer sistema de classificação (ranking, categoria, faixa, etc.).
export type PlayerLevel = string;
/** @deprecated use PlayerLevel */
export type TennisClass = PlayerLevel;

export interface Sport {
  id: string;
  slug: string; // 'tenis' | 'padel' | 'volei' | ... | 'outro'
  name: string;
  icon: string; // nome do ícone lucide-react
  playersPerMatch: number; // ex.: 2 (tênis), 4 (padel/vôlei de dupla), 12 (vôlei de quadra)
  defaultDurationMinutes: number;
  usesLevel: boolean; // se este esporte classifica jogadores por nível
  active: boolean;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  phone?: string;
  level: PlayerLevel;
  isAdmin: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export type MatchStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export interface Court {
  id: string;
  name: string;
  surface: string;
  active: boolean;
  sportId: string;
  sportName?: string;
}

export interface Match {
  id: string;
  sportId: string;
  sportName?: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  level: PlayerLevel;
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: MatchStatus;
  createdAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
}

export interface CourtSlot {
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "08:00"
  available: boolean;
  match?: Match;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface BlockedSlot {
  courtId?: string; // undefined = bloqueio em todas as quadras
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm or undefined for full day
  endTime?: string;
  allDay: boolean;
  reason: string;
  createdAt: string;
}

// Grupo = clube, academia, condomínio ou grupo de amigos que compartilha quadras.
export interface Group {
  id: string;
  name: string;
  clubName: string;
  inviteCode: string;
  sports: Sport[];
  createdAt: string;
}

export interface CourtConfig {
  courtName: string;
  clubName: string;
  groupName: string;
  slotDurationMinutes: number;
  openTime: string; // "06:00"
  closeTime: string; // "22:00"
  activeDays: number[]; // 0 (Sun) to 6 (Sat)
  maxAdvanceBookingDays: number;
  timeSlots?: Array<{ startTime: string; endTime: string }>;
}
