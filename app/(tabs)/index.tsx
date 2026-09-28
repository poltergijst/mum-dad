import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardCounters } from '@/components/DashboardCounters';
import { DashboardStats } from '@/components/DashboardStats';
import { DashboardControls } from '@/components/DashboardControls';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAppState } from '@/hooks/useAppState';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing, fontSizes, borderRadius, responsiveSize } from '@/constants/theme';
import { getSpeechCode, DEFAULT_LANGUAGE, type LanguageCode } from '@/constants/translations';

SplashScreen.preventAutoHideAsync();

export default function Dashboard() {
  const [fontsLoaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
  });

  const {
    mumCount,
    dadCount,
    lastDetection,
    lastTranscript,
    isLoading,
    error,
    onTranscriptionReceived,
    onTranscriptionError,
    resetCounts,
    totalCalls,
    clearError,
    incrementMum,
    incrementDad,
    setLanguage,
    setDetectionLabels,
  } = useAppState();
  const { t, language } = useLanguage();

  const {
    isTranscribing,
    lastTranscript: interimTranscript,
    isSupported: speechSupported,
    startRealTimeTranscription,
    stopRealTimeTranscription,
  } = useSpeechToText({
    language: getSpeechCode(language),
    onTranscription: onTranscriptionReceived,
    onError: onTranscriptionError,
  });

  const isActiveRef = useRef(false);

  useEffect(() => {
    setLanguage(language);
    setDetectionLabels(t('counter.mumLabel'), t('counter.dadLabel'));
  }, [setLanguage, setDetectionLabels, language, t]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleToggleListening = async () => {
    if (!isActiveRef.current) {
      if (speechSupported) {
        isActiveRef.current = true;
        await startRealTimeTranscription();
        AccessibilityInfo.announceForAccessibility(t('index.voiceStarted'));
      } else {
        AccessibilityInfo.announceForAccessibility(t('index.voiceUnsupported'));
      }
    } else {
      isActiveRef.current = false;
      stopRealTimeTranscription();
      AccessibilityInfo.announceForAccessibility(t('index.voiceStopped'));
    }
  };

  const handleResetCounts = () => {
    Alert.alert(
      t('index.resetTitle'),
      t('index.resetMessage'),
      [
        { text: t('index.cancel'), style: "cancel" },
        {
          text: t('index.resetConfirm'),
          onPress: async () => {
            await resetCounts();
            AccessibilityInfo.announceForAccessibility(t('index.resetDone'));
          },
          style: "destructive"
        }
      ]
    );
  };

  if (error) {
    return (
      <LinearGradient
        colors={colors.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={clearError}>
            <Text style={styles.errorButtonText}>{t('index.dismiss')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!fontsLoaded || isLoading) {
    return (
      <LinearGradient
        colors={colors.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} color={colors.white} />
          <Text style={styles.loadingText}>{t('loading.app')}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          isListening={isTranscribing}
          isTranscribing={isTranscribing}
          lastDetection={lastDetection}
          processingAudio={isTranscribing}
          lastTranscript={interimTranscript || lastTranscript}
          speechSupported={speechSupported}
        />

        <DashboardCounters
          mumCount={mumCount}
          dadCount={dadCount}
          totalCalls={totalCalls}
          onIncrementMum={incrementMum}
          onIncrementDad={incrementDad}
        />

        <DashboardStats
          mumCount={mumCount}
          dadCount={dadCount}
          totalCalls={totalCalls}
        />

        <DashboardControls
          isListening={isTranscribing}
          isTranscribing={isTranscribing}
          onToggleListening={handleToggleListening}
          onResetCounts={handleResetCounts}
          mumCount={mumCount}
          dadCount={dadCount}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: responsiveSize(16),
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: spacing.lg,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorButton: {
    backgroundColor: colors.whiteTransparent,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  errorButtonText: {
    fontSize: spacing.lg,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
  },
});
