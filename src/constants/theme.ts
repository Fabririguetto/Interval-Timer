export const PHASE_COLORS = {
  prepare: {
    bg: '#1A1A2E',
    accent: '#4FC3F7',
    label: '#90CAF9',
    text: '#E3F2FD',
  },
  work: {
    bg: '#0D2818',
    accent: '#69F0AE',
    label: '#A5D6A7',
    text: '#E8F5E9',
  },
  rest: {
    bg: '#1C1B0A',
    accent: '#FFD54F',
    label: '#FFE082',
    text: '#FFF9E6',
  },
  transition: {
    bg: '#1A0E2E',
    accent: '#CE93D8',
    label: '#BA68C8',
    text: '#F3E5F5',
  },
  rest_between_rounds: {
    bg: '#001820',
    accent: '#80DEEA',
    label: '#80CBC4',
    text: '#E0F7FA',
  },
  done: {
    bg: '#0D0D0D',
    accent: '#78909C',
    label: '#B0BEC5',
    text: '#ECEFF1',
  },
  idle: {
    bg: '#111111',
    accent: '#FF6B35',
    label: '#BDBDBD',
    text: '#FFFFFF',
  },
} as const;

export const PHASE_LABELS: Record<string, string> = {
  prepare: 'PREPARACIÓN',
  work: 'TRABAJO',
  rest: 'DESCANSO',
  transition: 'SIGUIENTE →',
  rest_between_rounds: 'ENTRE RONDAS',
  done: '¡COMPLETADO!',
};

export const UI = {
  bg: '#0F0F0F',
  surface: '#1C1C1E',
  surfaceHigh: '#2C2C2E',
  border: '#3A3A3C',
  primary: '#FF6B35',
  primaryDim: '#4A2515',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
  danger: '#FF453A',
  success: '#32D74B',
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;
