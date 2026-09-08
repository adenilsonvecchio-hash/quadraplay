export const SPORTS = [
  { id: 'tenis', name: 'Tênis', emoji: '🎾', color: '#929da5', image: './sports/tenis-v73.png' },
  { id: 'futsal', name: 'Futsal', emoji: '⚽', color: '#929da5', image: './sports/futsal-v73.png' },
  { id: 'futebol-campo', name: 'Futebol de Campo', emoji: '⚽', color: '#929da5', image: './sports/futebol-campo-v73.png' },
  { id: 'beach-tennis', name: 'Beach Tennis', emoji: '🏓', color: '#929da5', image: './sports/beach-tennis-v73.png' },
  { id: 'handebol', name: 'Handebol', emoji: '🔵', color: '#929da5', image: './sports/handebol-v73.png' },
  { id: 'volei', name: 'Vôlei', emoji: '🏐', color: '#929da5', image: './sports/volei-v73.png' },
  { id: 'basquete', name: 'Basquete', emoji: '🏀', color: '#929da5', image: './sports/basquete-v73.png' },
  { id: 'peteca', name: 'Peteca', emoji: '🏸', color: '#929da5', image: './sports/peteca-v73.png' },
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
