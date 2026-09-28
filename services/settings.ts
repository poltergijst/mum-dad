import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@mumdad_settings';

export interface AppSettings {
  sensitivity: number;
  backgroundMode: boolean;
  notifications: boolean;
  batteryOptimization: boolean;
  language?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 75,
  backgroundMode: true,
  notifications: true,
  batteryOptimization: true,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
