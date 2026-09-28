import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionResultEvent,
  type ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';
import { isSpeechRecognitionSupported } from '@/services/speechToText';
import { getAllContextualStrings } from '@/constants/wordVariants';

interface UseSpeechToTextProps {
  language?: string;
  onTranscription: (transcript: string, confidence: number) => void;
  onError: (error: string) => void;
}

export function useSpeechToText({ language = 'en-US', onTranscription, onError }: UseSpeechToTextProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const isActiveRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAttemptsRef = useRef(0);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setIsTranscribing(true);
    startAttemptsRef.current = 0;
  });

  useSpeechRecognitionEvent('end', () => {
    setIsTranscribing(false);
    if (isActiveRef.current) {
      restartTimerRef.current = setTimeout(() => {
        if (isActiveRef.current) {
          try {
            startAttemptsRef.current += 1;
            ExpoSpeechRecognitionModule.start({
              lang: language,
              interimResults: true,
              continuous: true,
              requiresOnDeviceRecognition: false,
              contextualStrings: getAllContextualStrings(language),
            });
          } catch {
            // Already started or stopped
          }
        }
      }, 200);
    }
  });

  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResultEvent) => {
    if (!event.isFinal) {
      if (event.results?.[0]?.transcript) {
        setLastTranscript(event.results[0].transcript);
      }
      return;
    }

    const transcript = event.results?.[0]?.transcript || '';
    if (!transcript.trim()) return;

    setLastTranscript(transcript);
    onTranscription(transcript, event.results?.[0]?.confidence ?? 0.9);
  });

  useSpeechRecognitionEvent('error', (event: ExpoSpeechRecognitionErrorEvent) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;

    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      setPermissionStatus('denied');
      onError('Microphone permission denied. Please allow microphone access and try again.');
      isActiveRef.current = false;
      setIsTranscribing(false);
    } else if (event.error === 'network' || event.error === 'audio-capture') {
      if (startAttemptsRef.current < 3 && isActiveRef.current) {
        return;
      }
      onError(`Speech recognition error: ${event.error}`);
      isActiveRef.current = false;
      setIsTranscribing(false);
    } else {
      onError(`Speech recognition error: ${event.error}`);
      isActiveRef.current = false;
      setIsTranscribing(false);
    }
  });

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (result.granted) {
        setPermissionStatus('granted');
        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch {
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  const startRealTimeTranscription = useCallback(async () => {
    if (isTranscribing || isActiveRef.current) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      onError('Microphone permission denied. Please allow microphone access and try again.');
      return;
    }

    isActiveRef.current = true;
    startAttemptsRef.current = 0;

    try {
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
        contextualStrings: getAllContextualStrings(language),
      });
    } catch {
      onError('Failed to start speech recognition');
      isActiveRef.current = false;
    }
  }, [isTranscribing, language, onError, requestPermissions]);

  const stopRealTimeTranscription = useCallback(() => {
    isActiveRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Already stopped
    }
    setIsTranscribing(false);
  }, []);

  return {
    isTranscribing,
    lastTranscript,
    isSupported,
    permissionStatus,
    startRealTimeTranscription,
    stopRealTimeTranscription,
  };
}
