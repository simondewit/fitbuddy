// Kleuren en typografie uit het design (sectie 2a).

import { Platform, TextStyle } from 'react-native';

export const colors = {
  background: '#f7f3ea',
  ink: '#1c1b18',
  muted: '#8b8478',
  pillText: '#5e574c',
  pillBg: 'rgba(59,42,34,0.06)',
  line: 'rgba(59,42,34,0.1)',
  track: 'rgba(59,42,34,0.1)',
  card: '#ffffff',
  outline: '#3b2a22',
  danger: '#b5432f',
} as const;

export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

const tabular: TextStyle = Platform.OS === 'web' ? {} : { fontVariant: ['tabular-nums'] };

export const type = {
  score: { fontFamily: fonts.bold, fontSize: 92, letterSpacing: -4, lineHeight: 96, color: colors.ink, ...tabular },
  title: { fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.8, color: colors.ink },
  heading: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  stat: { fontFamily: fonts.semibold, fontSize: 22, letterSpacing: -0.4, color: colors.ink, ...tabular },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.ink },
  label: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  pill: { fontFamily: fonts.medium, fontSize: 13, color: colors.pillText },
} satisfies Record<string, TextStyle>;
