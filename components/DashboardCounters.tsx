import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CounterCard } from './CounterCard';
import { useLanguage } from '@/hooks/useLanguage';

interface DashboardCountersProps {
  mumCount: number;
  dadCount: number;
  totalCalls: number;
  onIncrementMum?: () => void;
  onIncrementDad?: () => void;
}

export function DashboardCounters({
  mumCount,
  dadCount,
  totalCalls,
  onIncrementMum,
  onIncrementDad
}: DashboardCountersProps) {
  const { t } = useLanguage();
  const mumPercentage = totalCalls > 0 ? Math.round((mumCount / totalCalls) * 100) : 0;
  const dadPercentage = totalCalls > 0 ? Math.round((dadCount / totalCalls) * 100) : 0;

  return (
    <View style={styles.container}>
      <CounterCard
        title={t('counter.mum')}
        count={mumCount}
        percentage={mumPercentage}
        color="#FF6B6B"
        gradient={['#FF6B6B', '#FF8E85'] as const}
        onIncrement={onIncrementMum}
      />

      <CounterCard
        title={t('counter.dad')}
        count={dadCount}
        percentage={dadPercentage}
        color="#4ECDC4"
        gradient={['#4ECDC4', '#6FDED0'] as const}
        onIncrement={onIncrementDad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
});