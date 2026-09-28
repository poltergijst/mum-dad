import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusIndicator } from './StatusIndicator';
import { LoadingSpinner } from './LoadingSpinner';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';

interface DashboardHeaderProps {
  isListening: boolean;
  isTranscribing: boolean;
  lastDetection: string | null;
  processingAudio: boolean;
  lastTranscript: string | null;
  speechSupported: boolean;
}

export function DashboardHeader({
  isListening,
  isTranscribing,
  lastDetection,
  processingAudio,
  lastTranscript,
  speechSupported,
}: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t('app.name')}</Text>
      <Text style={styles.subtitle}>{t('app.tagline')}</Text>
      <StatusIndicator isListening={isListening || isTranscribing} lastDetection={lastDetection} />

      {!speechSupported && !isListening && (
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            {t('header.speechUnsupported')}
          </Text>
        </View>
      )}

      {processingAudio && (
        <View style={styles.processingContainer}>
          <LoadingSpinner size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.processingText}>{t('header.listening')}</Text>
        </View>
      )}

      {lastTranscript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>{t('header.lastHeard')}</Text>
          <Text style={styles.transcriptText} numberOfLines={2}>"{lastTranscript}"</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: colors.blackTransparent,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-Regular',
    color: colors.whiteTransparent,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  noticeContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.whiteTransparentLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    maxWidth: '90%',
  },
  noticeText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Fredoka-Regular',
    color: colors.whiteTransparent,
    textAlign: 'center',
    lineHeight: 16,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.whiteTransparentLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  processingText: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-Regular',
    color: colors.whiteTransparent,
  },
  transcriptContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.whiteTransparentHeavy,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    maxWidth: '90%',
    ...shadows.small,
  },
  transcriptLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  transcriptText: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
});
