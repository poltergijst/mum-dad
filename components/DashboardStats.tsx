import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStatsProps {
  mumCount: number;
  dadCount: number;
  totalCalls: number;
}

export function DashboardStats({ mumCount, dadCount, totalCalls }: DashboardStatsProps) {
  const { t } = useLanguage();

  const getLeaderText = () => {
    if (mumCount > dadCount) return t('stats.mumLeads');
    if (dadCount > mumCount) return t('stats.dadLeads');
    return t('stats.tie');
  };

  const getLeadDifference = () => {
    return totalCalls > 0 ? Math.abs(mumCount - dadCount) : 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{totalCalls}</Text>
        <Text style={styles.statLabel}>{t('stats.totalCallsToday')}</Text>
      </View>
      
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{getLeadDifference()}</Text>
        <Text style={styles.statLabel}>{getLeaderText()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: Math.max(16, screenWidth * 0.04),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: Math.min(24, screenWidth * 0.06),
    fontFamily: 'Fredoka-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Math.min(12, screenWidth * 0.03),
    fontFamily: 'Fredoka-Regular',
    color: '#666',
    textAlign: 'center',
  },
});