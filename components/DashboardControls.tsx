import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Share } from 'react-native';
import { RotateCcw, Mic, MicOff, Share as ShareIcon } from 'lucide-react-native';
import { colors, spacing, fontSizes, borderRadius, shadows, responsiveSize } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';

interface DashboardControlsProps {
  isListening: boolean;
  isTranscribing: boolean;
  onToggleListening: () => void;
  onResetCounts: () => void;
  mumCount?: number;
  dadCount?: number;
}

export function DashboardControls({
  isListening,
  isTranscribing,
  onToggleListening,
  onResetCounts,
  mumCount = 0,
  dadCount = 0,
}: DashboardControlsProps) {
  const { t } = useLanguage();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (isListening || isTranscribing) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isListening, isTranscribing, pulseAnim]);

  const handleShare = async () => {
    const total = mumCount + dadCount;
    const message = t('controls.shareMessage', { mum: mumCount, dad: dadCount, total });
    try {
      await Share.share({ message });
    } catch {
      // User cancelled or share failed
    }
  };

  const isActive = isListening || isTranscribing;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.controlButton, styles.sideButton]}
        onPress={onResetCounts}
        accessibilityLabel={t('controls.resetLabel')}
        accessibilityHint={t('controls.resetHint')}
      >
        <RotateCcw size={18} color="#666" />
        <Text style={[styles.controlButtonText, styles.sideButtonText]}>{t('controls.reset')}</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.mainButton,
            isActive ? styles.stopButton : styles.startButton
          ]}
          onPress={onToggleListening}
          accessibilityLabel={isActive ? t('controls.stopLabel') : t('controls.startLabel')}
          accessibilityHint={isActive ? t('controls.stopHint') : t('controls.startHint')}
        >
          {isActive ? (
            <>
              <MicOff size={24} color="white" />
              <Text style={[styles.controlButtonText, styles.mainButtonText]}>{t('controls.stop')}</Text>
            </>
          ) : (
            <>
              <Mic size={24} color="white" />
              <Text style={[styles.controlButtonText, styles.mainButtonText]}>{t('controls.start')}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={[styles.controlButton, styles.sideButton]}
        onPress={handleShare}
        accessibilityLabel={t('controls.shareLabel')}
        accessibilityHint={t('controls.shareHint')}
      >
        <ShareIcon size={18} color="#666" />
        <Text style={[styles.controlButtonText, styles.sideButtonText]}>{t('controls.share')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  sideButton: {
    backgroundColor: colors.whiteTransparent,
    padding: spacing.md,
    minWidth: responsiveSize(70),
  },
  mainButton: {
    width: responsiveSize(80),
    height: responsiveSize(80),
    borderRadius: responsiveSize(40),
    marginHorizontal: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  controlButtonText: {
    fontFamily: 'Fredoka-Regular',
    fontSize: fontSizes.xs,
    marginTop: 3,
  },
  sideButtonText: {
    color: colors.textSecondary,
  },
  mainButtonText: {
    color: colors.white,
    fontSize: fontSizes.sm,
  },
});
