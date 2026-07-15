import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#FBC02D',          // Energetic Gold/Yellow (Brand Primary)
    secondary: '#16A34A',        // Grass Green (Affirmative/Secondary Actions)
    accent: '#0284C7',           // Sky Blue (Info / Rescheduling)
    danger: '#DC2626',           // Bright Red (Cancel / Errors)
    warning: '#D97706',          // Warm Amber (Pending / Alert)
    background: '#F8FAFC',       // Soft slate background
    surface: '#FFFFFF',          // Card/Sheet background
    surfaceVariant: '#F1F5F9',   // Alternating fields
    border: '#E2E8F0',           // Neutral dividers
    text: '#0F172A',             // Dark Slate (Primary Text)
    textSecondary: '#64748B',    // Muted Slate (Subtitle/Secondary Text)
    onPrimary: '#1E293B',        // Dark text to go on top of primary gold
    onSecondary: '#FFFFFF',      // White text to go on top of green
    cardShadow: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    glassmorphism: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 1,
    }
  },
  dark: {
    primary: '#FBC02D',          // Gold/Yellow brand (stays bright in dark mode)
    secondary: '#22C55E',        // Brighter green for contrast
    accent: '#38BDF8',           // Sky blue for visibility
    danger: '#EF4444',           // Soft red
    warning: '#F59E0B',          // Soft orange
    background: '#090D16',       // Deep navy/black background
    surface: '#151D30',          // Elevated dark container background
    surfaceVariant: '#1E2942',   // Selection/fields background
    border: '#2A364F',           // Dark borders
    text: '#F8FAFC',             // Off-white primary text
    textSecondary: '#94A3B8',    // Slate text secondary
    onPrimary: '#0F172A',        // Dark text for gold buttons
    onSecondary: '#FFFFFF',      // White text for green buttons
    cardShadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
    glassmorphism: {
      backgroundColor: 'rgba(21, 29, 48, 0.75)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    }
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    sansBold: 'System',
    sansMedium: 'System',
  },
  android: {
    sans: 'sans-serif',
    sansBold: 'sans-serif-condensed',
    sansMedium: 'sans-serif-medium',
  },
  default: {
    sans: 'normal',
    sansBold: 'normal',
    sansMedium: 'normal',
  },
});

export const Typography = {
  h1: {
    fontSize: 32,
    fontFamily: Fonts.sansBold,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontFamily: Fonts.sansBold,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontFamily: Fonts.sansMedium,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bodyLarge: {
    fontSize: 16,
    fontFamily: Fonts.sans,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '400' as const,
    lineHeight: 14,
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Border = {
  radiusSm: 6,
  radiusMd: 12,
  radiusLg: 20,
  radiusRound: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 34, android: 16 }) ?? 0;
export const MaxContentWidth = 800;
