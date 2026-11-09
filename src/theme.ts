export const colors = {
  night: '#06130F',
  sheet: '#071A13',
  ink: '#151A33',
  inkSoft: '#505873',
  paper: '#F1F3F8',
  paperEdge: '#DDE1EC',
  pitch: '#0A3323',
  pitchDeep: '#04120C',
  floodlight: '#FFF1CC',
  emerald: '#14B87A',
  gold: '#FFC24B',
  goldDeep: '#F29E1B',
  win: '#6EF0B0',
  winDeep: '#0E9F6E',
  loss: '#FF7A8E',
  live: '#FF4D5E',
  text: '#F4F5FF',
  textSoft: 'rgba(244,245,255,0.80)',
  textMute: 'rgba(244,245,255,0.62)',
  glassFill: 'rgba(255,255,255,0.09)',
};

export const font = {
  regular: 'Sora_400Regular',
  semi: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
  mono: 'DMMono_400Regular',
  monoMed: 'DMMono_500Medium',
};

export const radius = { card: 24, button: 16, pill: 999 };
export const MARGIN = 20; // the one left/right grid margin

export const naira = (n: number) =>
  '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
