import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/hooks/useLanguage';

const { width: screenWidth } = Dimensions.get('window');

interface CounterCardProps {
  title: string;
  count: number;
  percentage: number;
  color: string;
  gradient: readonly [string, string, ...string[]];
  onIncrement?: () => void;
}

export const CounterCard = memo(function CounterCard({
  title,
  count,
  percentage,
  color,
  gradient,
  onIncrement
}: CounterCardProps) {
  const { t } = useLanguage();

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${title}: ${count} ${t('analytics.calls')}, ${percentage} percent`}
      accessibilityRole="button"
    >
      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.8}
        disabled={!onIncrement}
      >
        <LinearGradient
          colors={gradient}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.count}>{count}</Text>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentage}>{percentage}%</Text>
          </View>
          {onIncrement && (
            <Text style={styles.tapHint}>{t('counter.tapToAdd')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    padding: Math.max(16, screenWidth * 0.04),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Math.max(100, screenWidth * 0.28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: Math.min(16, screenWidth * 0.04),
    fontFamily: 'Fredoka-SemiBold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  count: {
    fontSize: Math.min(28, screenWidth * 0.07),
    fontFamily: 'Fredoka-SemiBold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  percentageContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  percentage: {
    fontSize: Math.min(11, screenWidth * 0.028),
    fontFamily: 'Fredoka-Regular',
    color: 'white',
    fontWeight: 'bold',
  },
  tapHint: {
    fontSize: Math.min(10, screenWidth * 0.025),
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});