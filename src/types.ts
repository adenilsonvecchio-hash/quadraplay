export type TennisClass = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Player {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tennisClass: TennisClass;
  isAdmin: boolean;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  createdAt: string;
}

export type MatchStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';
export type MatchResultStatus = 'pending_confirmation' | 'confirmed' | 'disputed';
export type MatchOutcome =
  | 'played'
  | 'not_played'
  | 'walkover_player1'
  | 'walkover_player2'
  | 'double_walkover'
  | 'retirement_player1'
  | 'retirement_player2'
  | 'interrupted'
  | 'reschedule';

export interface MatchScoreSet {
  player1: number;
  player2: number;
}

export interface Court {
  id: string;
  name: string;
  surface: string;
  active: boolean;
}

export interface Match {
  id: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  tennisClass: TennisClass;
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
  resultOutcome?: MatchOutcome;
  resultScore?: MatchScoreSet[];
  resultStatus?: MatchResultStatus;
  resultSubmittedBy?: string;
  resultSubmittedAt?: string;
  resultConfirmedBy?: string;
  resultConfirmedAt?: string;
  resultDisputeReason?: string;
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
