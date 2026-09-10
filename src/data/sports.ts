export const SPORTS = [
  { id: 'tenis', name: 'Tênis', emoji: '🎾', color: '#f5b400', image: './sports/tenis-v82.png' },
] as const;

export type SportId = typeof SPORTS[number]['id'];
export type Sport = typeof SPORTS[number];

export const getStoredSportId = (): SportId => 'tenis';

export const getActiveSportId = (): SportId => 'tenis';

export const getSport = (sportId: SportId): Sport =>
  SPORTS.find((sport) => sport.id === sportId) || SPORTS[0];
