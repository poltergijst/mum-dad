import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';

interface StatusIndicatorProps {
  isListening: boolean;
  lastDetection: string | null;
}

export function StatusIndicator({ isListening, lastDetection }: StatusIndicatorProps) {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;
    
    if (isListening) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isListening, pulseAnim]);

  useEffect(() => {
    if (lastDetection) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [lastDetection, fadeAnim]);

  return (
    <View style={styles.container}>
      {isListening && (
        <View style={styles.activeContainer}>
          <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.activeText}>{t('status.active')}</Text>
        </View>
      )}
      
      {lastDetection && (
        <Animated.View style={[styles.detectionAlert, { opacity: fadeAnim }]}>
          <Text style={styles.detectionText}>{t('status.heard', { word: lastDetection })}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  activeContainer: {
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
  },
  activeText: {
    fontSize: 12,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
  },
  detectionAlert: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  detectionText: {
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
    color: '#333',
    textAlign: 'center',
  },
});