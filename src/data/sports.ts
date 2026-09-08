export const SPORTS = [
  { id: 'tenis', name: 'Tênis', emoji: '🎾', color: '#f5b400', image: './sports/tenis-v82.png' },
  { id: 'futsal', name: 'Futsal', emoji: '⚽', color: '#f5b400', image: './sports/futsal-v82.png' },
  { id: 'futebol-campo', name: 'Futebol de Campo', emoji: '⚽', color: '#f5b400', image: './sports/futebol-campo-v82.png' },
  { id: 'beach-tennis', name: 'Beach Tennis', emoji: '🏓', color: '#f5b400', image: './sports/beach-tennis-v82.png' },
  { id: 'handebol', name: 'Handebol', emoji: '🔵', color: '#f5b400', image: './sports/handebol-v82.png' },
  { id: 'volei', name: 'Vôlei', emoji: '🏐', color: '#f5b400', image: './sports/volei-v82.png' },
  { id: 'basquete', name: 'Basquete', emoji: '🏀', color: '#f5b400', image: './sports/basquete-v82.png' },
  { id: 'peteca', name: 'Peteca', emoji: '🏸', color: '#f5b400', image: './sports/peteca-v82.png' },
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
