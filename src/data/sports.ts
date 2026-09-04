export const SPORTS = [
  { id: 'tenis', name: 'Tênis', emoji: '🎾', color: '#6c4cf5' },
  { id: 'futsal', name: 'Futsal', emoji: '⚽', color: '#168c5b' },
  { id: 'futebol-campo', name: 'Futebol de Campo', emoji: '🥅', color: '#267248' },
  { id: 'beach-tennis', name: 'Beach Tennis', emoji: '🏖️', color: '#e49a17' },
  { id: 'handebol', name: 'Handebol', emoji: '🤾', color: '#e7663c' },
  { id: 'volei', name: 'Vôlei', emoji: '🏐', color: '#3479d0' },
  { id: 'basquete', name: 'Basquete', emoji: '🏀', color: '#d96620' },
] as const;

export type SportId = typeof SPORTS[number]['id'];
export type Sport = typeof SPORTS[number];

export const ACTIVE_SPORT_STORAGE_KEY = 'quadraplay:active-sport';

export const getStoredSportId = (): SportId | null => {
  const value = localStorage.getItem(ACTIVE_SPORT_STORAGE_KEY);
  return SPORTS.some((sport) => sport.id === value) ? value as SportId : null;
};

export const getActiveSportId = (): SportId => getStoredSportId() || 'tenis';

export const getSport = (sportId: SportId): Sport =>
  SPORTS.find((sport) => sport.id === sportId) || SPORTS[0];
