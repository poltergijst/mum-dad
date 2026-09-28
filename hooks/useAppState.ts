import { useState, useCallback, useRef, useEffect } from 'react';
import { getWordDetectionSummary } from '@/utils/wordDetection';
import { updateUserStats, getDailyStats, resetDailyStats, checkAndUnlockAchievements } from '@/services/achievements';
import { loadSettings, saveSettings, AppSettings as StoredSettings } from '@/services/settings';
import { DEFAULT_LANGUAGE } from '@/constants/wordVariants';

export type AppSettings = StoredSettings;

export interface AppState {
  mumCount: number;
  dadCount: number;
  lastDetection: string | null;
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  lastTranscript: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 75,
  backgroundMode: true,
  notifications: true,
  batteryOptimization: true,
};

const ACHIEVEMENT_CHECK_DEBOUNCE_MS = 5000;

export function useAppState() {
  const [state, setState] = useState<AppState>({
    mumCount: 0,
    dadCount: 0,
    lastDetection: null,
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    error: null,
    lastTranscript: null,
  });

  const mountedRef = useRef(true);
  const achievementCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAchievementCheckRef = useRef(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const stored = await loadSettings();
        const dailyStats = await getDailyStats();
        const today = new Date().toISOString().split('T')[0];
        const todayStats = dailyStats.find(stat => stat.date === today);

        if (mountedRef.current) {
          setState(prevState => ({
            ...prevState,
            settings: { ...DEFAULT_SETTINGS, ...stored },
            mumCount: todayStats?.mumCount ?? 0,
            dadCount: todayStats?.dadCount ?? 0,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
        if (mountedRef.current) {
          setState(prevState => ({ ...prevState, isLoading: false }));
        }
      }
    }

    loadInitial();
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (achievementCheckTimerRef.current) {
        clearTimeout(achievementCheckTimerRef.current);
      }
    };
  }, []);

  const languageRef = useRef(DEFAULT_LANGUAGE);
  const detectionLabelRef = useRef<{ mum: string; dad: string }>({ mum: 'mum', dad: 'dad' });

  const debouncedAchievementCheck = useCallback(() => {
    if (achievementCheckTimerRef.current) {
      clearTimeout(achievementCheckTimerRef.current);
    }
    pendingAchievementCheckRef.current = true;
    achievementCheckTimerRef.current = setTimeout(async () => {
      pendingAchievementCheckRef.current = false;
      try {
        await checkAndUnlockAchievements();
      } catch (err) {
        console.error('Failed to check achievements:', err);
      }
    }, ACHIEVEMENT_CHECK_DEBOUNCE_MS);
  }, []);

  const onTranscriptionReceived = useCallback((transcript: string, confidence: number) => {
    if (!mountedRef.current) return;

    const detection = getWordDetectionSummary(transcript, languageRef.current);

    if (detection.totalDetections === 0) {
      setState(prevState => ({
        ...prevState,
        lastTranscript: transcript,
      }));
      return;
    }

    const lastWord = detection.detectedWords[detection.detectedWords.length - 1];
    const lastLabel = lastWord === 'mum' ? detectionLabelRef.current.mum : detectionLabelRef.current.dad;

    setState(prevState => ({
      ...prevState,
      lastTranscript: transcript,
      lastDetection: lastLabel,
      mumCount: prevState.mumCount + detection.mumCount,
      dadCount: prevState.dadCount + detection.dadCount,
    }));

    updateUserStats(detection.mumCount, detection.dadCount).catch(err => {
      console.error('Failed to update stats:', err);
    });

    debouncedAchievementCheck();
  }, [debouncedAchievementCheck]);

  const onTranscriptionError = useCallback((error: string) => {
    if (!mountedRef.current) return;

    setState(prevState => ({
      ...prevState,
      error: `Transcription failed: ${error}`,
    }));
  }, []);

  const resetCounts = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      await resetDailyStats();
      setState(prevState => ({
        ...prevState,
        mumCount: 0,
        dadCount: 0,
        lastDetection: null,
        lastTranscript: null,
      }));
    } catch (error) {
      console.error('Failed to reset counts:', error);
      setState(prevState => ({
        ...prevState,
        error: 'Failed to reset counts. Please try again.',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  const incrementMum = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prevState => ({
      ...prevState,
      mumCount: prevState.mumCount + 1,
      lastDetection: detectionLabelRef.current.mum,
    }));
    updateUserStats(1, 0).catch(err => {
      console.error('Failed to update stats:', err);
    });
    debouncedAchievementCheck();
  }, [debouncedAchievementCheck]);

  const incrementDad = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prevState => ({
      ...prevState,
      dadCount: prevState.dadCount + 1,
      lastDetection: detectionLabelRef.current.dad,
    }));
    updateUserStats(0, 1).catch(err => {
      console.error('Failed to update stats:', err);
    });
    debouncedAchievementCheck();
  }, [debouncedAchievementCheck]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    if (!mountedRef.current) return;
    setState(prevState => {
      const newSettings = { ...prevState.settings, ...partial };
      saveSettings(newSettings).catch(err => {
        console.error('Failed to save settings:', err);
      });
      return { ...prevState, settings: newSettings };
    });
  }, []);

  const setLanguage = useCallback((lang: string) => {
    languageRef.current = lang;
  }, []);

  const setDetectionLabels = useCallback((mum: string, dad: string) => {
    detectionLabelRef.current = { mum, dad };
  }, []);

  const totalCalls = state.mumCount + state.dadCount;

  return {
    mumCount: state.mumCount,
    dadCount: state.dadCount,
    lastDetection: state.lastDetection,
    settings: state.settings,
    isLoading: state.isLoading,
    error: state.error,
    lastTranscript: state.lastTranscript,
    totalCalls,
    onTranscriptionReceived,
    onTranscriptionError,
    resetCounts,
    clearError,
    incrementMum,
    incrementDad,
    updateSettings,
    setLanguage,
    setDetectionLabels,
  };
}
