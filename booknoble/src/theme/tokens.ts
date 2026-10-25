/**
 * BookNoble design tokens.
 * Deep Purple brands and navigates, Royal Blue drives interaction, Noble Gold
 * is a sparing accent, white carries content. Every text/background pairing
 * below meets WCAG AA (4.5:1) for body text.
 */
export const brand = {
  deepPurple: '#170D35',
  royalBlue: '#2850D8',
  nobleGold: '#D9B56B',
  white: '#FFFFFF',
} as const;

export const palettes = {
  light: {
    background: '#F7F6FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEDF5',
    border: '#E4E1EE',
    borderStrong: '#D5D2E0',
    text: '#170D35',
    textSecondary: '#5E5878',
    textOnPrimary: '#FFFFFF',
    primary: brand.royalBlue,
    primaryPressed: '#1B3BAA',
    primarySoft: '#EDF1FD',
    onPrimarySoft: '#1B3BAA',
    link: '#2850D8',
    gold: brand.nobleGold,
    goldText: '#7A5A16',
    goldSoft: '#FBF4E6',
    nav: brand.deepPurple,
    onNav: '#FFFFFF',
    onNavMuted: '#C9C3E0',
    success: '#157A47',
    successSoft: '#E6F5EC',
    warning: '#8A5A00',
    warningSoft: '#FFF4DC',
    danger: '#B42318',
    dangerSoft: '#FDECEA',
    overlay: 'rgba(23,13,53,0.55)',
    shadow: 'rgba(23,13,53,0.12)',
  },
  dark: {
    background: '#0E0722',
    surface: '#1A1138',
    surfaceAlt: '#231848',
    border: '#2C2154',
    borderStrong: '#3B2E6B',
    text: '#FFFFFF',
    textSecondary: '#B9B3D1',
    textOnPrimary: '#FFFFFF',
    primary: brand.royalBlue,
    primaryPressed: '#3A62EA',
    primarySoft: '#1E2A66',
    onPrimarySoft: '#C7D3FA',
    link: '#8FA6F5',
    gold: brand.nobleGold,
    goldText: '#F2CF8A',
    goldSoft: '#2E2414',
    nav: brand.deepPurple,
    onNav: '#FFFFFF',
    onNavMuted: '#B9B3D1',
    success: '#8FE3B0',
    successSoft: '#123222',
    warning: '#F2CF8A',
    warningSoft: '#33260D',
    danger: '#FF9B8F',
    dangerSoft: '#3A1418',
    overlay: 'rgba(0,0,0,0.6)',
    shadow: 'rgba(0,0,0,0.4)',
  },
} as const;

export type Palette = { [K in keyof (typeof palettes)['light']]: string };

export const fonts = {
  heading: 'Manrope_800ExtraBold',
  headingSemi: 'Manrope_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 16, xl: 22, pill: 999 } as const;

export const type = {
  display: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 34, letterSpacing: -0.4 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.headingSemi, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, letterSpacing: 0.8 },
  stat: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 26 },
} as const;

export const MAX_CONTENT_WIDTH = 720;
