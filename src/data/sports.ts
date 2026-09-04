export const SPORTS = [
  { id: 'tenis', name: 'Tênis', emoji: '🎾', color: '#a4c51d', image: './sports/tenis-v68.png' },
  { id: 'futsal', name: 'Futsal', emoji: '⚽', color: '#1675ef', image: './sports/futsal-v68.png' },
  { id: 'futebol-campo', name: 'Futebol de Campo', emoji: '⚽', color: '#168c5b', image: './sports/futebol-campo-v68.png' },
  { id: 'beach-tennis', name: 'Beach Tennis', emoji: '🏓', color: '#e49a17', image: './sports/beach-tennis-v68.png' },
  { id: 'handebol', name: 'Handebol', emoji: '🔵', color: '#f06432', image: './sports/handebol-v68.png' },
  { id: 'volei', name: 'Vôlei', emoji: '🏐', color: '#3479d0', image: './sports/volei-v68.png' },
  { id: 'basquete', name: 'Basquete', emoji: '🏀', color: '#e75e12', image: './sports/basquete-v68.png' },
  { id: 'peteca', name: 'Peteca', emoji: '🏸', color: '#8a43ed', image: './sports/peteca-v68.png' },
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
