import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Calendar, TrendingUp, ChartPie as PieChart } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { getDailyStats } from '@/services/achievements';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing, fontSizes, borderRadius, shadows, responsiveSize } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface PeriodData {
  mum: number;
  dad: number;
  total: number;
}

const MUM_COLOR = '#FF6B6B';
const DAD_COLOR = '#4ECDC4';

function DonutChart({ mum, dad, callsLabel }: { mum: number; dad: number; callsLabel: string }) {
  const total = mum + dad;
  const size = 140;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total === 0) {
    return (
      <View style={donutStyles.container}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
          />
        </Svg>
        <View style={donutStyles.centerLabel}>
          <Text style={donutStyles.centerValue}>0</Text>
          <Text style={donutStyles.centerSubtext}>{callsLabel}</Text>
        </View>
      </View>
    );
  }

  const mumPct = mum / total;
  const dadPct = dad / total;
  const mumAngle = mumPct * 360;
  const dadAngle = dadPct * 360;

  const describeArc = (startAngle: number, sweepAngle: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + sweepAngle - 90) * (Math.PI / 180);
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <View style={donutStyles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth={strokeWidth}
        />
        {dadPct > 0 && dadPct < 1 && (
          <Path
            d={describeArc(mumAngle, dadAngle)}
            fill="none"
            stroke={DAD_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {dadPct === 1 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={DAD_COLOR}
            strokeWidth={strokeWidth}
          />
        )}
        {mumPct > 0 && mumPct < 1 && (
          <Path
            d={describeArc(0, mumAngle)}
            fill="none"
            stroke={MUM_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {mumPct === 1 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={MUM_COLOR}
            strokeWidth={strokeWidth}
          />
        )}
      </Svg>
      <View style={donutStyles.centerLabel}>
        <Text style={donutStyles.centerValue}>{total}</Text>
        <Text style={donutStyles.centerSubtext}>{callsLabel}</Text>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
  },
  centerSubtext: {
    fontSize: 11,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
  },
});

export default function Analytics() {
  const { t } = useLanguage();
  const [fontsLoaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ day: PeriodData; week: PeriodData; month: PeriodData }>({
    day: { mum: 0, dad: 0, total: 0 },
    week: { mum: 0, dad: 0, total: 0 },
    month: { mum: 0, dad: 0, total: 0 },
  });

  const periods = [
    { key: 'day' as const, label: t('analytics.today'), icon: Calendar },
    { key: 'week' as const, label: t('analytics.thisWeek'), icon: TrendingUp },
    { key: 'month' as const, label: t('analytics.thisMonth'), icon: PieChart },
  ];

  const loadAnalyticsData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      setError(null);
      const dailyStats = await getDailyStats();

      const today = new Date().toISOString().split('T')[0];
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayStats = dailyStats.find(stat => stat.date === today);
      const weekStats = dailyStats.filter(stat => stat.date >= oneWeekAgo);
      const monthStats = dailyStats.filter(stat => stat.date >= oneMonthAgo);

      setData({
        day: {
          mum: todayStats?.mumCount || 0,
          dad: todayStats?.dadCount || 0,
          total: todayStats?.totalCalls || 0,
        },
        week: {
          mum: weekStats.reduce((sum, stat) => sum + stat.mumCount, 0),
          dad: weekStats.reduce((sum, stat) => sum + stat.dadCount, 0),
          total: weekStats.reduce((sum, stat) => sum + stat.totalCalls, 0),
        },
        month: {
          mum: monthStats.reduce((sum, stat) => sum + stat.mumCount, 0),
          dad: monthStats.reduce((sum, stat) => sum + stat.dadCount, 0),
          total: monthStats.reduce((sum, stat) => sum + stat.totalCalls, 0),
        },
      });
    } catch (err) {
      setError(t('analytics.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const currentData = data[selectedPeriod];
  const mumPercentage = currentData.total > 0 ? Math.round((currentData.mum / currentData.total) * 100) : 0;
  const dadPercentage = currentData.total > 0 ? Math.round((currentData.dad / currentData.total) * 100) : 0;
  const divisor = selectedPeriod === 'day' ? 1 : selectedPeriod === 'week' ? 7 : 30;

  if (!fontsLoaded || isLoading) {
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
            <Text style={styles.loadingText}>{t('loading.analytics')}</Text>
          </View>
        </SafeAreaView>
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
        <View style={styles.header}>
          <Text style={styles.title}>{t('analytics.title')}</Text>
          <Text style={styles.subtitle}>{t('analytics.subtitle')}</Text>
        </View>

        <View style={styles.periodSelector}>
          {periods.map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.periodButton,
                selectedPeriod === key && styles.activePeriodButton
              ]}
              onPress={() => setSelectedPeriod(key)}
            >
              <Icon
                size={18}
                color={selectedPeriod === key ? colors.white : colors.textSecondary}
              />
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === key && styles.activePeriodButtonText
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadAnalyticsData(true)}
              tintColor={colors.white}
            />
          }
        >
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t('analytics.distribution')}</Text>
            <DonutChart mum={currentData.mum} dad={currentData.dad} callsLabel={t('analytics.calls')} />

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: MUM_COLOR }]} />
                <Text style={styles.legendText}>{t('counter.mumLabel')} ({currentData.mum}) - {mumPercentage}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: DAD_COLOR }]} />
                <Text style={styles.legendText}>{t('counter.dadLabel')} ({currentData.dad}) - {dadPercentage}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{currentData.total}</Text>
              <Text style={styles.statLabel}>{t('analytics.totalCalls')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.abs(currentData.mum - currentData.dad)}</Text>
              <Text style={styles.statLabel}>
                {currentData.mum > currentData.dad ? t('analytics.mumAdvantage') : t('analytics.dadAdvantage')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(currentData.total / divisor)}
              </Text>
              <Text style={styles.statLabel}>{t('analytics.dailyAverage')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {currentData.mum === currentData.dad ? t('stats.tie') : currentData.mum > currentData.dad ? t('counter.mumLabel') : t('counter.dadLabel')}
              </Text>
              <Text style={styles.statLabel}>{t('analytics.currentLeader')}</Text>
            </View>
          </View>

          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>{t('analytics.funInsights')}</Text>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>{t('analytics.winner')}</Text>
              <Text style={styles.insightText}>
                {currentData.mum > currentData.dad
                  ? t('analytics.mumAhead', { count: currentData.mum - currentData.dad })
                  : currentData.dad > currentData.mum
                  ? t('analytics.dadAhead', { count: currentData.dad - currentData.mum })
                  : t('analytics.perfectTie')}
              </Text>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>{t('analytics.pace')}</Text>
              <Text style={styles.insightText}>
                {selectedPeriod === 'day'
                  ? t('analytics.callsToday', { count: currentData.total })
                  : t('analytics.avgPerDay', { count: Math.round(currentData.total / divisor), period: t(selectedPeriod === 'week' ? 'analytics.week' : 'analytics.month') })}
              </Text>
            </View>
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
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.whiteTransparent,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: spacing.xs,
  },
  activePeriodButton: {
    backgroundColor: MUM_COLOR,
  },
  periodButtonText: {
    fontFamily: 'Fredoka-Regular',
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  activePeriodButtonText: {
    color: colors.white,
  },
  chartContainer: {
    backgroundColor: colors.whiteTransparentHeavy,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.small,
  },
  chartTitle: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: 'Fredoka-Regular',
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.whiteTransparentHeavy,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    alignItems: 'center',
    width: (screenWidth - responsiveSize(16) * 2 - spacing.md) / 2,
    ...shadows.small,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  insightsContainer: {
    marginBottom: spacing.xxl + spacing.lg,
  },
  insightsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  insightCard: {
    backgroundColor: colors.whiteTransparentHeavy,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.small,
  },
  insightLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-SemiBold',
    color: MUM_COLOR,
    minWidth: 50,
  },
  insightText: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: 'rgba(244,67,54,0.9)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textAlign: 'center',
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
});
