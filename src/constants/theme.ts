import '@/global.css';

// Fixed accent colors - already proven legible on both the light (cream) and
// dark (chat) surfaces today, so they don't need a themed variant. `ink` is
// specifically for content placed on top of these fixed accents (e.g. dark
// text on a yellow CTA chip) - unlike `colors.text`, it never inverts with
// the theme, because the accent chip it sits on doesn't invert either.
export const Brand = {
  ink: '#161616',
  inkMuted: '#3A382F',
  yellow: '#F6C445',
  pink: '#F3A7C7',
  green: '#3FBE7A',
  red: '#E0555A',
  white: '#FFFFFF',
  textMuted: '#8C876F',
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  border: string;
  iconChipBackground: string;
  bubbleMineBackground: string;
  bubbleMineText: string;
  bubbleOtherBackground: string;
  bubbleOtherText: string;
  overlay: string;
  topFadeRgba: string;
};

export const lightColors: ThemeColors = {
  background: '#F7F3E6',
  surface: '#EFEAD6',
  surfaceElevated: '#E4DEC5',
  text: '#161616',
  textSecondary: '#3A382F',
  border: '#E0D9BE',
  iconChipBackground: '#161616',
  bubbleMineBackground: '#161616',
  bubbleMineText: '#FFFFFF',
  bubbleOtherBackground: '#EFEAD6',
  bubbleOtherText: '#161616',
  overlay: 'rgba(22,22,22,0.45)',
  topFadeRgba: 'rgba(247,243,230,0.7)',
};

// Reproduces the app's existing (always-on) dark chat palette exactly, so
// dark mode looks identical to what Chat already looked like before theming.
export const darkColors: ThemeColors = {
  background: '#151515',
  surface: '#242424',
  surfaceElevated: '#1F1F1F',
  text: '#FFFFFF',
  textSecondary: '#D8D5C9',
  border: '#333333',
  iconChipBackground: '#242424',
  bubbleMineBackground: '#FFFFFF',
  bubbleMineText: '#161616',
  bubbleOtherBackground: '#242424',
  bubbleOtherText: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
  topFadeRgba: 'rgba(21,21,21,0.65)',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Fonts = {
  regular: 'Baloo2_400Regular',
  medium: 'Baloo2_500Medium',
  semiBold: 'Baloo2_600SemiBold',
  bold: 'Baloo2_700Bold',
  extraBold: 'Baloo2_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;
