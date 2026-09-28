import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const colors = {
  gradient: ['#FFE66D', '#FF6B6B', '#4ECDC4'] as const,
  white: '#FFFFFF',
  whiteTransparent: 'rgba(255,255,255,0.9)',
  whiteTransparentLight: 'rgba(255,255,255,0.2)',
  whiteTransparentMedium: 'rgba(255,255,255,0.8)',
  whiteTransparentHeavy: 'rgba(255,255,255,0.95)',
  black: '#000000',
  blackTransparent: 'rgba(0,0,0,0.1)',
  textPrimary: '#333',
  textSecondary: '#666',
  success: '#4CAF50',
  error: '#F44336',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 16,
  md: 20,
  lg: 40,
};

export const fontSizes = {
  xs: Math.min(11, screenWidth * 0.028),
  sm: Math.min(12, screenWidth * 0.03),
  md: Math.min(14, screenWidth * 0.035),
  lg: Math.min(18, screenWidth * 0.045),
  xl: Math.min(28, screenWidth * 0.07),
};

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const responsiveSize = (baseSize: number) => Math.max(baseSize, screenWidth * (baseSize / 400));
