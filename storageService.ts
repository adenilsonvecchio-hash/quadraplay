import { Player, Match, BlockedSlot, CourtConfig, TennisClass, CourtSlot, Court } from '../types';
import { INITIAL_PLAYERS, generateInitialMatches, generateInitialBlockedSlots, DEFAULT_COURT_CONFIG, COURTS } from '../data/initialData';
import { getBrasiliaToday, isSlotInPast, generateDaySlots, isBeforeDate } from '../utils/dateUtils';

const STORAGE_KEYS = {
  PLAYERS: 'quadraplay_players_v1',
  MATCHES: 'quadraplay_matches_v1',
  BLOCKED: 'quadraplay_blocked_v1',
  // v2 aplica a grade oficial: 07:00–17:30 em blocos fixos de 90 minutos.
  CONFIG: 'quadraplay_config_v2',
  COURTS: 'quadraplay_courts_v1',
  CURRENT_USER_ID: 'quadraplay_current_user_id_v1',
};

class StorageService {
  private players: Player[] = [];
  private matches: Match[] = [];
  private blockedSlots: BlockedSlot[] = [];
  private config: CourtConfig = DEFAULT_COURT_CONFIG;
  private courts: Court[] = COURTS;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (storedPlayers) {
        this.players = JSON.parse(storedPlayers);
      } else {
        this.players = INITIAL_PLAYERS;
        this.savePlayers();
      }

      const storedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
      if (storedMatches) {
        this.matches = JSON.parse(storedMatches).map((m: Match) => ({ ...m, courtId: m.courtId || 'court-1' }));
      } else {
        this.matches = generateInitialMatches();
        this.saveMatches();
      }

      const storedBlocked = localStorage.getItem(STORAGE_KEYS.BLOCKED);
      if (storedBlocked) {
        this.blockedSlots = JSON.parse(storedBlocked);
      } else {
        this.blockedSlots = generateInitialBlockedSlots();
        this.saveBlocked();
      }

      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
      } else {
        this.config = DEFAULT_COURT_CONFIG;
        this.saveConfig();
      }

      const storedCourts = localStorage.getItem(STORAGE_KEYS.COURTS);
      const parsedCourts = storedCourts ? JSON.parse(storedCourts) : COURTS;
      this.courts = Array.isArray(parsedCourts) ? parsedCourts : COURTS;
      if (!storedCourts) this.saveCourts();
    } catch (e) {
      console.error('Failed to load from storage, using initial data', e);
      this.players = INITIAL_PLAYERS;
      this.matches = generateInitialMatches();
      this.blockedSlots = generateInitialBlockedSlots();
      this.config = DEFAULT_COURT_CONFIG;
      this.courts = COURTS;
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private savePlayers() {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(this.players));
    this.notify();
  }

  private saveMatches() {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(this.matches));
    this.notify();
  }

  private saveBlocked() {
    localStorage.setItem(STORAGE_KEYS.BLOCKED, JSON.stringify(this.blockedSlots));
    this.notify();
  }

  private saveConfig() {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    this.notify();
  }

  private saveCourts() {
    localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(this.courts));
    this.notify();
  }

  // --- Players ---
  public getPlayers(): Player[] {
    return [...this.players];
  }

  public getPlayerById(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  public getPlayerByEmail(email: string): Player | undefined {
    return this.players.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
  }

  public getPlayersByClass(tennisClass: TennisClass): Player[] {
    return this.players.filter((p) => p.tennisClass === tennisClass);
  }

  public savePlayer(playerData: Partial<Player> & { name: string; email: string; tennisClass: TennisClass }): Player {
    if (playerData.id) {
      // Edit
      const index = this.players.findIndex((p) => p.id === playerData.id);
      if (index !== -1) {
        this.players[index] = {
          ...this.players[index],
          ...playerData,
        };
        this.savePlayers();
        return this.players[index];
      }
    }

    // Create
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: playerData.name,
      email: playerData.email,
      phone: playerData.phone,
      tennisClass: playerData.tennisClass,
      isAdmin: !!playerData.isAdmin,
      createdAt: new Date().toISOString(),
    };
    this.players.push(newPlayer);
    this.savePlayers();
    return newPlayer;
  }

  public deletePlayer(id: string): { success: boolean; message?: string } {
    // Check if player has scheduled matches
    const hasScheduled = this.matches.some(
      (m) => (m.status === 'scheduled' || m.status === 'pending') && (m.player1Id === id || m.player2Id === id)
    );
    if (hasScheduled) {
      return { success: false, message: 'O jogador possui jogos agendados futuros. Cancele os jogos antes de excluí-lo.' };
    }

    this.players = this.players.filter((p) => p.id !== id);
    this.savePlayers();
    return { success: true };
  }

  // --- Matches ---
  public getMatches(): Match[] {
    return [...this.matches];
  }

  public getPlayerMatches(playerId: string): {
    upcoming: Match[];
    past: Match[];
    cancelled: Match[];
  } {
    const playerMatches = this.matches.filter(
      (m) => m.player1Id === playerId || m.player2Id === playerId
    );
    const today = getBrasiliaToday();

    const upcoming: Match[] = [];
    const past: Match[] = [];
    const cancelled: Match[] = [];

    playerMatches.forEach((m) => {
      if (m.status === 'cancelled') {
        cancelled.push(m);
      } else if (m.status === 'scheduled' || m.status === 'pending') {
        if (m.date < today || (m.date === today && isSlotInPast(m.date, m.startTime))) {
          past.push({ ...m, status: 'completed' });
        } else {
          upcoming.push(m);
        }
      } else {
        past.push(m);
      }
    });

    // Sort upcoming ascending (soonest first)
    upcoming.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
    // Sort past descending (most recent first)
    past.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
    // Sort cancelled descending
    cancelled.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

    return { upcoming, past, cancelled };
  }

  public getCourts(activeOnly = true): Court[] {
    const courts = Array.isArray(this.courts) ? this.courts : COURTS;
    return courts.filter((court) => !activeOnly || court.active).map((court) => ({ ...court }));
  }

  public updateCourt(courtId: string, changes: Partial<Omit<Court, 'id'>>) {
    this.courts = this.courts.map((court) => court.id === courtId ? { ...court, ...changes } : court);
    this.saveCourts();
  }

  public getCourtScheduleForDate(date: string, courtId: string = 'court-1'): CourtSlot[] {
    const baseSlots = this.config.timeSlots?.length
      ? this.config.timeSlots.map((slot) => ({ ...slot }))
      : generateDaySlots(this.config.openTime, this.config.closeTime, this.config.slotDurationMinutes);
    const dateMatches = this.matches.filter((m) => m.date === date && m.courtId === courtId && (m.status === 'scheduled' || m.status === 'pending'));
    const dateBlocks = this.blockedSlots.filter((b) => b.date === date && (!b.courtId || b.courtId === courtId));

    return baseSlots.map((slot) => {
      // 1. Check if past
      const isPast = isSlotInPast(date, slot.startTime);
      if (isPast) {
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: false,
          isBlocked: false,
          blockReason: 'Horário já transcorrido',
        };
      }

      // 2. Check blocks
      const block = dateBlocks.find((b) => {
        if (b.allDay) return true;
        if (b.startTime && b.endTime) {
          return slot.startTime >= b.startTime && slot.startTime < b.endTime;
        }
        return false;
      });

      if (block) {
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: false,
          isBlocked: true,
          blockReason: block.reason,
        };
      }

      // 3. Check existing match on court
      const match = dateMatches.find((m) => m.startTime === slot.startTime);
      if (match) {
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: false,
          match,
        };
      }

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: true,
      };
    });
  }

  public createMatch(params: {
    player1Id: string;
    player2Id: string;
    date: string;
    startTime: string;
    endTime: string;
    courtId: string;
  }): { success: boolean; match?: Match; error?: string } {
    const today = getBrasiliaToday();

    // 1. Validation: date in past
    if (isBeforeDate(params.date, today)) {
      return { success: false, error: 'Não é permitido agendar em datas anteriores ao dia atual.' };
    }

    // 2. Validation: time slot in past
    if (isSlotInPast(params.date, params.startTime)) {
      return { success: false, error: 'Este horário já transcorreu no dia de hoje.' };
    }

    // 3. Validation: same player
    if (params.player1Id === params.player2Id) {
      return { success: false, error: 'Um jogador não pode agendar um jogo contra ele mesmo.' };
    }

    const player1 = this.getPlayerById(params.player1Id);
    const player2 = this.getPlayerById(params.player2Id);
    const court = this.courts.find((c) => c.id === params.courtId && c.active);

    if (!court) {
      return { success: false, error: 'Quadra inválida ou indisponível.' };
    }

    if (!player1 || !player2) {
      return { success: false, error: 'Jogadores não encontrados.' };
    }

    // 4. Validation: different classes
    if (player1.tennisClass !== player2.tennisClass) {
      return {
        success: false,
        error: `Não é permitido agendar contra outra classe (${player1.tennisClass} vs ${player2.tennisClass}).`,
      };
    }

    // 5. Validation: court slot already taken
    const existingCourtMatch = this.matches.find(
      (m) => m.date === params.date && m.courtId === params.courtId && m.startTime === params.startTime && (m.status === 'scheduled' || m.status === 'pending')
    );
    if (existingCourtMatch) {
      return { success: false, error: 'A quadra já está reservada para este dia e horário.' };
    }

    // 6. Validation: blocked slot
    const isBlocked = this.blockedSlots.some((b) => {
      if (b.date !== params.date || (b.courtId && b.courtId !== params.courtId)) return false;
      if (b.allDay) return true;
      if (b.startTime && b.endTime) {
        return params.startTime >= b.startTime && params.startTime < b.endTime;
      }
      return false;
    });
    if (isBlocked) {
      return { success: false, error: 'Este horário está bloqueado pela administração do clube.' };
    }

    // 7. Validation: either player already in another match at the exact same time
    const player1Clash = this.matches.find(
      (m) =>
        m.date === params.date &&
        m.startTime === params.startTime &&
        (m.status === 'scheduled' || m.status === 'pending') &&
        (m.player1Id === player1.id || m.player2Id === player1.id)
    );
    if (player1Clash) {
      return { success: false, error: `${player1.name} já possui outro jogo agendado neste mesmo horário.` };
    }

    const player2Clash = this.matches.find(
      (m) =>
        m.date === params.date &&
        m.startTime === params.startTime &&
        (m.status === 'scheduled' || m.status === 'pending') &&
        (m.player1Id === player2.id || m.player2Id === player2.id)
    );
    if (player2Clash) {
      return { success: false, error: `${player2.name} já possui outro jogo agendado neste mesmo horário.` };
    }

    // Success: Create match
    const newMatch: Match = {
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      player1Id: player1.id,
      player1Name: player1.name,
      player2Id: player2.id,
      player2Name: player2.name,
      tennisClass: player1.tennisClass,
      courtId: court.id,
      courtName: court.name,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.matches.push(newMatch);
    this.saveMatches();

    return { success: true, match: newMatch };
  }

  public cancelMatch(
    matchId: string,
    cancelledBy: string,
    cancelReason?: string
  ): { success: boolean; error?: string } {
    const matchIndex = this.matches.findIndex((m) => m.id === matchId);
    if (matchIndex === -1) {
      return { success: false, error: 'Jogo não encontrado.' };
    }

    const match = this.matches[matchIndex];
    if (match.status !== 'scheduled' && match.status !== 'pending') {
      return { success: false, error: 'Este jogo não pode mais ser cancelado.' };
    }

    this.matches[matchIndex] = {
      ...match,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy,
      cancelReason: cancelReason || 'Cancelado pelo usuário',
    };

    this.saveMatches();
    return { success: true };
  }

  public respondToMatch(matchId: string, playerId: string, accept: boolean): { success: boolean; error?: string } {
    const index = this.matches.findIndex((m) => m.id === matchId);
    if (index === -1) return { success: false, error: 'Jogo não encontrado.' };
    const match = this.matches[index];
    if (match.status !== 'pending') return { success: false, error: 'Este convite já foi respondido.' };
    if (match.player2Id !== playerId) return { success: false, error: 'Somente o jogador convidado pode responder.' };
    this.matches[index] = { ...match, status: accept ? 'scheduled' : 'cancelled', ...(accept ? {} : { cancelledAt: new Date().toISOString(), cancelledBy: playerId, cancelReason: 'Convite recusado' }) };
    this.saveMatches();
    return { success: true };
  }

  // --- Blocked Slots ---
  public getBlockedSlots(): BlockedSlot[] {
    return [...this.blockedSlots];
  }

  public addBlockedSlot(block: Omit<BlockedSlot, 'id' | 'createdAt'>): BlockedSlot {
    const newBlock: BlockedSlot = {
      ...block,
      id: `block-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.blockedSlots.push(newBlock);
    this.saveBlocked();
    return newBlock;
  }

  public removeBlockedSlot(id: string) {
    this.blockedSlots = this.blockedSlots.filter((b) => b.id !== id);
    this.saveBlocked();
  }

  // --- Court Config ---
  public getConfig(): CourtConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CourtConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  // --- Reset to default ---
  public resetToDefaults() {
    this.players = INITIAL_PLAYERS;
    this.matches = generateInitialMatches();
    this.blockedSlots = generateInitialBlockedSlots();
    this.config = DEFAULT_COURT_CONFIG;
    this.courts = COURTS;
    this.savePlayers();
    this.saveMatches();
    this.saveBlocked();
    this.saveConfig();
    this.saveCourts();
  }
}

export const storageService = new StorageService();
