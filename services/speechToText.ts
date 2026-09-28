import { Platform } from 'react-native';

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechToTextConfig {
  language: string;
}

export function isSpeechRecognitionSupported(): boolean {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }
  return true;
}
