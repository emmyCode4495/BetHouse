export type Market = '1' | 'X' | '2';
export type Team = { code: string; name: string; bg: string; fg: string };
export type Match = {
  id: string;
  league: string;
  home: Team;
  away: Team;
  live: boolean;
  minute?: number;
  score?: [number, number];
  kickoff?: string;
  odds: Record<Market, number>;
};

const t = (code: string, name: string, bg: string, fg = '#FFFFFF'): Team => ({ code, name, bg, fg });

export const MATCHES: Match[] = [
  { id: 'm1', league: 'Premier League', home: t('ARS', 'Arsenal', '#D3141C'), away: t('MCI', 'Man City', '#6CABDD', '#0B1F3A'),
    live: true, minute: 63, score: [1, 1], odds: { '1': 2.6, X: 2.95, '2': 2.7 } },
  { id: 'm2', league: 'NPFL', home: t('ENY', 'Enyimba', '#2D5BD0'), away: t('RAN', 'Rangers', '#D62839'),
    live: true, minute: 34, score: [0, 0], odds: { '1': 2.1, X: 2.85, '2': 3.6 } },
  { id: 'm3', league: 'Serie A', home: t('NAP', 'Napoli', '#12A0D7', '#06243A'), away: t('INT', 'Inter', '#1B3A8C'),
    live: true, minute: 78, score: [2, 1], odds: { '1': 1.35, X: 4.8, '2': 8.5 } },
  { id: 'm4', league: 'Premier League', home: t('LIV', 'Liverpool', '#C8102E'), away: t('CHE', 'Chelsea', '#034694'),
    live: false, kickoff: 'Today 17:30', odds: { '1': 1.95, X: 3.7, '2': 3.8 } },
  { id: 'm5', league: 'La Liga', home: t('BAR', 'Barcelona', '#A50044'), away: t('RMA', 'Real Madrid', '#E7E9EF', '#1A2140'),
    live: false, kickoff: 'Today 20:00', odds: { '1': 2.2, X: 3.6, '2': 3.05 } },
  { id: 'm6', league: 'NPFL', home: t('KAN', 'Kano Pillars', '#E3A008', '#241A00'), away: t('REM', 'Remo Stars', '#0E7C4A'),
    live: false, kickoff: 'Tomorrow 16:00', odds: { '1': 2.4, X: 2.9, '2': 2.95 } },
  { id: 'm7', league: 'Bundesliga', home: t('BAY', 'Bayern', '#DC052D'), away: t('BVB', 'Dortmund', '#FDE100', '#1A1A1A'),
    live: false, kickoff: 'Tomorrow 18:30', odds: { '1': 1.55, X: 4.6, '2': 5.6 } },
];

export const pickLabel = (m: Match, mk: Market) =>
  mk === '1' ? `${m.home.name} to win` : mk === '2' ? `${m.away.name} to win` : 'Draw';
export const shortLabel = (m: Match, mk: Market) =>
  mk === '1' ? m.home.code : mk === '2' ? m.away.code : 'Draw';
