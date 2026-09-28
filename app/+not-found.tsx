import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Home } from 'lucide-react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing, fontSizes, borderRadius } from '@/constants/theme';

export default function NotFoundScreen() {
  const { t } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>{t('notFound.title')}</Text>
        <Text style={styles.message}>{t('notFound.message')}</Text>
        <Link href="/" style={styles.link}>
          <View style={styles.linkButton}>
            <Home size={18} color={colors.white} />
            <Text style={styles.linkText}>{t('notFound.goHome')}</Text>
          </View>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8F8F8',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  link: {
    marginTop: spacing.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  linkText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
  },
});
