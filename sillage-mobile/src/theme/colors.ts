export const palettes = {
  'noir-chic': {
    bg: '#0B0B0B',
    text: '#F5F5F5',
    accent: '#D4AF37',
    secondary: '#5C5C5C',
  },
  'violeta-sensual': {
    bg: '#3B2C4D',
    text: '#FDFDFD',
    accent: '#C5B4E3',
    secondary: '#F0E0EA',
  },
  'minimal-light': {
    bg: '#F8F6F2',
    text: '#2B2B2B',
    accent: '#D6A7A1',
    secondary: '#A79F94',
  },
} as const;

export type PaletteName = keyof typeof palettes;
export type Palette = typeof palettes[PaletteName];