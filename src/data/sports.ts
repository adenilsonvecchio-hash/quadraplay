export const SPORTS = [
  { id: 'tenis', name: 'Tênis', emoji: '🎾', color: '#1239b8', image: './sports/tenis-v78.png' },
  { id: 'futsal', name: 'Futsal', emoji: '⚽', color: '#1239b8', image: './sports/futsal-v78.png' },
  { id: 'futebol-campo', name: 'Futebol de Campo', emoji: '⚽', color: '#1239b8', image: './sports/futebol-campo-v78.png' },
  { id: 'beach-tennis', name: 'Beach Tennis', emoji: '🏓', color: '#1239b8', image: './sports/beach-tennis-v78.png' },
  { id: 'handebol', name: 'Handebol', emoji: '🔵', color: '#1239b8', image: './sports/handebol-v78.png' },
  { id: 'volei', name: 'Vôlei', emoji: '🏐', color: '#1239b8', image: './sports/volei-v78.png' },
  { id: 'basquete', name: 'Basquete', emoji: '🏀', color: '#1239b8', image: './sports/basquete-v78.png' },
  { id: 'peteca', name: 'Peteca', emoji: '🏸', color: '#1239b8', image: './sports/peteca-v78.png' },
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
