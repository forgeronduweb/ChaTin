import '@/global.css';

export const Brand = {
  cream: '#F7F3E6',
  paper: '#EFEAD6',
  ink: '#161616',
  inkMuted: '#3A382F',
  textMuted: '#8C876F',
  yellow: '#F6C445',
  pink: '#F3A7C7',
  green: '#3FBE7A',
  white: '#FFFFFF',
  chatBackground: '#151515',
  chatBubble: '#242424',
  chatInput: '#1F1F1F',
} as const;

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
} as const;
