import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';

const { width: screenWidth } = Dimensions.get('window');

const FUN_FACTS: string[] = [
  "Did you know? 73% of kids say 'mum' 40% more than 'dad'. The other 27% are probably asleep.",
  "Fun fact: The word 'mum' has been spoken approximately 84 billion times today. We're counting every single one.",
  "Breaking news: Dad called. He says he's the favorite. We'll see about that.",
  "Did you know? Saying 'mum' three times in front of a mirror summons snacks. (Not scientifically proven.)",
  "Fun fact: The average toddler says 'dad' 12 times before breakfast. Then switches to 'mum' for the rest of the day.",
  "Did you know? 100% of parents think they're the favorite. Only 50% are right.",
  "Fun fact: MumDad Tracker has eavesdropped on approximately zero conversations. We're very polite about it.",
  "Breaking: A child somewhere just said 'mum' for the 1,000th time today. Mum is not impressed.",
  "Did you know? The word 'dad' in 47 languages sounds suspiciously like 'dad'. Coincidence? Probably.",
  "Fun fact: If you stacked every 'mum' ever said, it would reach the moon. The moon is very confused.",
  "Did you know? Scientists estimate that 94% of all 'dad' calls happen when something needs fixing.",
  "Breaking news: Mum called. She says you never call anymore. This app is helping you prove otherwise.",
];

const LOADING_MESSAGES: string[] = [
  'Warming up the microphone...',
  'Calibrating parent-detection algorithms...',
  'Teaching AI the difference between mum and dad...',
  'Polishing the counter buttons...',
  'Consulting the family oracle...',
  'Loading parental favoritism data...',
  'Sharpening the word detector...',
  'Negotiating with the speech fairy...',
  'Inflating the achievement badges...',
  'Untangling the headphone cord...',
];

export function SplashScreen() {
  const [fontsLoaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
  });

  const [visible, setVisible] = useState(true);
  const [factIndex, setFactIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const factFadeAnim = useRef(new Animated.Value(0)).current;
  const messageFadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 8,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    Animated.timing(factFadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(messageFadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 600,
      useNativeDriver: true,
    }).start();

    const dotLoop = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
        ])
      ).start();
    };

    dotLoop(dot1Anim, 0);
    dotLoop(dot2Anim, 200);
    dotLoop(dot3Anim, 400);

    const factTimer = setInterval(() => {
      Animated.timing(factFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setFactIndex(prev => (prev + 1) % FUN_FACTS.length);
        Animated.timing(factFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 3500);

    const messageTimer = setInterval(() => {
      Animated.timing(messageFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(messageFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    const exitTimer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }).start(() => setVisible(false));
    }, 3200);

    return () => {
      clearInterval(factTimer);
      clearInterval(messageTimer);
      clearTimeout(exitTimer);
    };
  }, [fontsLoaded]);

  if (!visible || !fontsLoaded) return null;

  const mumBounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });
  const dadBounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  const dot1Scale = dot1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const dot2Scale = dot2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const dot3Scale = dot3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const dot1Opacity = dot1Anim;
  const dot2Opacity = dot2Anim;
  const dot3Opacity = dot3Anim;

  return (
    <Animated.View style={[styles.overlay, { opacity: exitAnim }]} pointerEvents="none">
      <LinearGradient
        colors={['#FFE66D', '#FF6B6B', '#4ECDC4']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoRow}>
            <Animated.View style={[styles.badge, styles.mumBadge, { transform: [{ translateY: mumBounce }] }]}>
              <Text style={styles.badgeText}>MUM</Text>
            </Animated.View>
            <Text style={styles.vsText}>vs</Text>
            <Animated.View style={[styles.badge, styles.dadBadge, { transform: [{ translateY: dadBounce }] }]}>
              <Text style={styles.badgeText}>DAD</Text>
            </Animated.View>
          </View>

          <Text style={styles.appName}>MumDad Tracker</Text>
          <Text style={styles.tagline}>Who's the favorite today?</Text>
        </Animated.View>

        <Animated.View style={[styles.loadingContainer, { opacity: messageFadeAnim }]}>
          <Text style={styles.loadingMessage}>{LOADING_MESSAGES[messageIndex]}</Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { transform: [{ scale: dot1Scale }], opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { transform: [{ scale: dot2Scale }], opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { transform: [{ scale: dot3Scale }], opacity: dot3Opacity }]} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.factContainer, { opacity: factFadeAnim }]}>
          <Text style={styles.factText} numberOfLines={4}>
            {FUN_FACTS[factIndex]}
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...({ __docId: null } as any),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  mumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  dadBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 3,
    borderColor: '#4ECDC4',
  },
  badgeText: {
    fontSize: 28,
    fontFamily: 'Fredoka-SemiBold',
    color: '#333',
  },
  vsText: {
    fontSize: 22,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  appName: {
    fontSize: Math.min(36, screenWidth * 0.09),
    fontFamily: 'Fredoka-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 30,
    minHeight: 50,
  },
  loadingMessage: {
    fontSize: 14,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  factContainer: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  factText: {
    fontSize: 13,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
