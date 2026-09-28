import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Trophy, Star, Target, Zap, Award, TrendingUp } from 'lucide-react-native';
import { ACHIEVEMENTS, getUserAchievements, checkAndUnlockAchievements } from '@/services/achievements';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing, fontSizes, borderRadius, shadows, responsiveSize } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface AchievementDisplay {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  first_steps: Star,
  chatter_champion: Trophy,
  equal_opportunity: Target,
  week_warrior: Zap,
  century_club: Award,
  dedication: TrendingUp,
};

const RARITY_COLORS: Record<string, readonly [string, string]> = {
  common: ['#4ECDC4', '#6FE5D8'] as const,
  rare: ['#3B82F6', '#60A5FA'] as const,
  epic: ['#F59E0B', '#FBBF24'] as const,
  legendary: ['#EF4444', '#F87171'] as const,
};

const RARITY_BORDER: Record<string, string> = {
  common: '#4ECDC4',
  rare: '#3B82F6',
  epic: '#F59E0B',
  legendary: '#EF4444',
};

export default function Achievements() {
  const { t } = useLanguage();
  const [fontsLoaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
  });

  const [achievements, setAchievements] = useState<AchievementDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAchievements = useCallback(async () => {
    try {
      setError(null);
      await checkAndUnlockAchievements();
      const userAchievements = await getUserAchievements();

      const achievementsData = ACHIEVEMENTS.map(achievement => {
        const userAchievement = userAchievements.get(achievement.id);
        return {
          id: achievement.id,
          title: t(`achievement.${achievement.id}.title`),
          description: t(`achievement.${achievement.id}.desc`),
          icon: ACHIEVEMENT_ICONS[achievement.id] || Star,
          unlocked: userAchievement?.unlockedAt !== null && userAchievement?.unlockedAt !== undefined,
          progress: userAchievement?.progress || 0,
          maxProgress: achievement.maxProgress,
          rarity: achievement.rarity,
        };
      });

      setAchievements(achievementsData);
    } catch (err) {
      setError(t('achievements.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
  };

  if (!fontsLoaded || loading) {
    return (
      <LinearGradient
        colors={colors.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={48} color={colors.white} />
            <Text style={styles.loadingText}>{t('loading.achievements')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPct = achievements.length > 0
    ? Math.round((unlockedCount / achievements.length) * 100)
    : 0;

  return (
    <LinearGradient
      colors={colors.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('achievements.title')}</Text>
          <Text style={styles.subtitle}>{t('achievements.subtitle')}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{unlockedCount}</Text>
              <Text style={styles.statLabel}>{t('achievements.unlocked')}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{completionPct}%</Text>
              <Text style={styles.statLabel}>{t('achievements.complete')}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.white}
            />
          }
        >
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {achievements.map((achievement) => {
            const IconComponent = achievement.icon;
            const rarityColors = RARITY_COLORS[achievement.rarity] ?? RARITY_COLORS.common;
            const borderColor = RARITY_BORDER[achievement.rarity] ?? RARITY_BORDER.common;

            return (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked ? styles.unlockedCard : styles.lockedCard,
                  { borderColor: achievement.unlocked ? borderColor : '#E0E0E0' }
                ]}
              >
                <LinearGradient
                  colors={achievement.unlocked ? rarityColors : ['#F5F5F5', '#E0E0E0'] as const}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconComponent
                    size={28}
                    color={achievement.unlocked ? colors.white : '#999'}
                  />
                </LinearGradient>

                <View style={styles.achievementContent}>
                  <View style={styles.titleRow}>
                    <Text style={[
                      styles.achievementTitle,
                      achievement.unlocked ? styles.unlockedTitle : styles.lockedTitle
                    ]}>
                      {achievement.title}
                    </Text>
                    <View style={[styles.rarityBadge, { backgroundColor: borderColor }]}>
                      <Text style={styles.rarityText}>
                        {t(`achievements.rarity.${achievement.rarity}`)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[
                    styles.achievementDescription,
                    achievement.unlocked ? styles.unlockedDescription : styles.lockedDescription
                  ]}>
                    {achievement.description}
                  </Text>

                  {!achievement.unlocked && achievement.maxProgress > 1 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                              backgroundColor: borderColor
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {achievement.progress}/{achievement.maxProgress}
                      </Text>
                    </View>
                  )}

                  {achievement.unlocked && (
                    <View style={styles.unlockedBadge}>
                      <Text style={styles.unlockedBadgeText}>{t('achievements.unlockedBadge')}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonTitle}>{t('achievements.moreComing')}</Text>
            <Text style={styles.comingSoonText}>
              {t('achievements.moreComingDesc')}
            </Text>
          </View>
        </ScrollView>
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
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: Math.min(32, screenWidth * 0.08),
    fontFamily: 'Fredoka-SemiBold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: Math.min(16, screenWidth * 0.04),
    fontFamily: 'Fredoka-Regular',
    color: colors.whiteTransparent,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statBadge: {
    backgroundColor: colors.whiteTransparent,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    alignItems: 'center',
    ...shadows.small,
  },
  statNumber: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(244,67,54,0.9)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textAlign: 'center',
  },
  achievementCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    ...shadows.small,
  },
  unlockedCard: {
    backgroundColor: colors.white,
  },
  lockedCard: {
    backgroundColor: '#F8F8F8',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
    flex: 1,
  },
  unlockedTitle: {
    color: colors.textPrimary,
  },
  lockedTitle: {
    color: '#999',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 9,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textTransform: 'uppercase',
  },
  achievementDescription: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    marginBottom: 6,
    lineHeight: 18,
  },
  unlockedDescription: {
    color: colors.textSecondary,
  },
  lockedDescription: {
    color: '#999',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  unlockedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  unlockedBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
  },
  comingSoonCard: {
    backgroundColor: colors.whiteTransparent,
    borderRadius: borderRadius.sm,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  comingSoonTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  comingSoonText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textAlign: 'center',
  },
});
