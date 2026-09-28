import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  maxProgress: number;
}

export interface UserStats {
  userId: string;
  totalMumCount: number;
  totalDadCount: number;
  totalCalls: number;
  consecutiveDays: number;
  lastActiveDate: string;
}

export interface DailyStats {
  userId: string;
  date: string;
  mumCount: number;
  dadCount: number;
  totalCalls: number;
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  unlockedAt: string | null;
}

/**
 * Presentation metadata only. The unlock rules themselves live in the database
 * (app_recompute_achievements) so progress cannot be self-reported by a client.
 * Keep `id` and `maxProgress` in sync with that function.
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Record your first "mum" or "dad"',
    rarity: 'common',
    maxProgress: 1,
  },
  {
    id: 'chatter_champion',
    title: 'Chatter Champion',
    description: 'Reach 50 total calls in a day',
    rarity: 'rare',
    maxProgress: 50,
  },
  {
    id: 'equal_opportunity',
    title: 'Equal Opportunity',
    description: 'Have a perfect 50-50 split for a full day (min 20 calls)',
    rarity: 'epic',
    maxProgress: 1,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Track for 7 consecutive days',
    rarity: 'rare',
    maxProgress: 7,
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: '100 calls in a single day',
    rarity: 'legendary',
    maxProgress: 100,
  },
  {
    id: 'dedication',
    title: 'Dedication',
    description: 'Reach 500 total calls overall',
    rarity: 'epic',
    maxProgress: 500,
  },
];

const USER_ID_KEY = '@mumdad_user_id';

/** Highest per-call increment the server will accept. Mirrors the database cap. */
const MAX_INCREMENT_PER_CALL = 100;

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

async function randomHex(byteLength: number): Promise<string> {
  try {
    const bytes = await Crypto.getRandomBytesAsync(byteLength);
    return toHex(bytes);
  } catch {
    const webCrypto = (globalThis as any)?.crypto;
    if (webCrypto?.getRandomValues) {
      const bytes = new Uint8Array(byteLength);
      webCrypto.getRandomValues(bytes);
      return toHex(bytes);
    }
    throw new Error('No secure random source available');
  }
}

function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    return [e.code, e.message, e.details, e.hint].filter(Boolean).join(' | ') || String(error);
  }
  return String(error);
}

let userIdPromise: Promise<string> | null = null;

async function loadOrCreateUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  // 16 random bytes from the platform CSPRNG: this id is the only thing that
  // identifies the device's data, so it must not be guessable.
  const userId = `user_${Date.now()}_${await randomHex(16)}`;
  await AsyncStorage.setItem(USER_ID_KEY, userId);
  return userId;
}

async function getUserId(): Promise<string> {
  if (!userIdPromise) {
    userIdPromise = loadOrCreateUserId().catch((error) => {
      userIdPromise = null;
      throw error;
    });
  }
  return userIdPromise;
}

function clampIncrement(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.floor(value), 0), MAX_INCREMENT_PER_CALL);
}

export async function getUserStats(): Promise<UserStats | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .rpc('app_get_user_stats', { p_user_id: userId })
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as any;
    return {
      userId: row.user_id,
      totalMumCount: row.total_mum_count,
      totalDadCount: row.total_dad_count,
      totalCalls: row.total_calls,
      consecutiveDays: row.consecutive_days,
      lastActiveDate: row.last_active_date,
    };
  } catch (error) {
    console.error('Error fetching user stats', describeError(error));
    return null;
  }
}

export async function updateUserStats(mumCount: number, dadCount: number): Promise<void> {
  try {
    const userId = await getUserId();
    const mum = clampIncrement(mumCount);
    const dad = clampIncrement(dadCount);

    if (mum === 0 && dad === 0) return;

    const { error: statsError } = await supabase.rpc('increment_user_stats', {
      p_user_id: userId,
      p_mum: mum,
      p_dad: dad,
    });
    if (statsError) throw statsError;

    const { error: dailyError } = await supabase.rpc('increment_daily_stats', {
      p_user_id: userId,
      p_mum: mum,
      p_dad: dad,
    });
    if (dailyError) throw dailyError;
  } catch (error) {
    console.error('Error updating user stats', describeError(error));
  }
}

export async function getDailyStats(): Promise<DailyStats[]> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase.rpc('app_get_daily_stats', { p_user_id: userId });

    if (error) throw error;

    return ((data as any[]) ?? []).map((d) => ({
      userId: d.user_id,
      date: d.date,
      mumCount: d.mum_count,
      dadCount: d.dad_count,
      totalCalls: d.total_calls,
    }));
  } catch (error) {
    console.error('Error fetching daily stats', describeError(error));
    return [];
  }
}

export async function getUserAchievements(): Promise<Map<string, UserAchievement>> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase.rpc('app_get_user_achievements', {
      p_user_id: userId,
    });

    if (error) throw error;

    const achievementsMap = new Map<string, UserAchievement>();
    ((data as any[]) ?? []).forEach((a) => {
      achievementsMap.set(a.achievement_id, {
        achievementId: a.achievement_id,
        progress: a.progress,
        unlockedAt: a.unlocked_at,
      });
    });

    return achievementsMap;
  } catch (error) {
    console.error('Error fetching user achievements', describeError(error));
    return new Map();
  }
}

/**
 * Asks the server to recompute achievement progress from its own stored counts.
 * The client no longer decides what is unlocked.
 */
export async function checkAndUnlockAchievements(): Promise<void> {
  try {
    const userId = await getUserId();

    const { error } = await supabase.rpc('app_recompute_achievements', {
      p_user_id: userId,
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error checking achievements', describeError(error));
  }
}

export async function resetDailyStats(): Promise<void> {
  try {
    const userId = await getUserId();

    const { error } = await supabase.rpc('app_reset_daily_stats', { p_user_id: userId });
    if (error) throw error;
  } catch (error) {
    console.error('Error resetting daily stats', describeError(error));
    throw new Error('Could not reset today\'s counts. Please try again.');
  }
}
