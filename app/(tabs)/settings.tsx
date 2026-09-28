import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Shield, Download, Info, Volume2, Battery, Bell, Globe } from 'lucide-react-native';
import { loadSettings, saveSettings, AppSettings } from '@/services/settings';
import { getDailyStats } from '@/services/achievements';
import { useLanguage, LANGUAGES, type LanguageCode } from '@/hooks/useLanguage';
import { colors, spacing, fontSizes, borderRadius, shadows, responsiveSize } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const [fontsLoaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
  });

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveSettings(next).catch(err => console.error('Failed to save settings:', err));
      return next;
    });
  }, []);

  const handleExportData = async () => {
    try {
      const dailyStats = await getDailyStats();
      const totalMum = dailyStats.reduce((sum, s) => sum + s.mumCount, 0);
      const totalDad = dailyStats.reduce((sum, s) => sum + s.dadCount, 0);
      const totalCalls = dailyStats.reduce((sum, s) => sum + s.totalCalls, 0);

      const lines = dailyStats.map(s =>
        t('settings.exportLine', { date: s.date, mum: s.mumCount, dad: s.dadCount, total: s.totalCalls })
      );
      const exportText = t('settings.exportTemplate', { mum: totalMum, dad: totalDad, total: totalCalls, lines: lines.join('\n') });

      await Share.share({ message: exportText });
    } catch (error) {
      Alert.alert(t('settings.exportFailed'), t('settings.exportError'));
    }
  };

  const handleSensitivityAdjust = (direction: 'up' | 'down') => {
    if (!settings) return;
    const next = direction === 'up'
      ? Math.min(100, settings.sensitivity + 5)
      : Math.max(0, settings.sensitivity - 5);
    updateSetting('sensitivity', next);
  };

  const handleSelectLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    setShowLanguagePicker(false);
  };

  if (!fontsLoaded || !settings) {
    return (
      <LinearGradient
        colors={colors.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading.settings')}</Text>
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
          <Text style={styles.title}>{t('settings.title')}</Text>
          <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            </View>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            >
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>{t('settings.language')}</Text>
                <Text style={styles.actionDescription}>{t('settings.languageDesc')}</Text>
              </View>
              <Text style={styles.languageValue}>
                {LANGUAGES.find(l => l.code === language)?.label ?? 'English'}
              </Text>
            </TouchableOpacity>

            {showLanguagePicker && (
              <View style={styles.languageList}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      lang.code === language && styles.languageItemSelected,
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={[
                      styles.languageItemText,
                      lang.code === language && styles.languageItemTextSelected,
                    ]}>
                      {lang.label}
                    </Text>
                    {lang.code === language && (
                      <Text style={styles.languageCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Volume2 size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>{t('settings.detection')}</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{t('settings.sensitivity')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.sensitivityDesc')}
                </Text>
                <View style={styles.sensitivityContainer}>
                  <TouchableOpacity
                    style={styles.sensitivityButton}
                    onPress={() => handleSensitivityAdjust('down')}
                  >
                    <Text style={styles.sensitivityButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sensitivityDisplay}>
                    <Text style={styles.sensitivityValue}>{settings.sensitivity}%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sensitivityButton}
                    onPress={() => handleSensitivityAdjust('up')}
                  >
                    <Text style={styles.sensitivityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Battery size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>{t('settings.performance')}</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{t('settings.batteryOpt')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.batteryOptDesc')}
                </Text>
              </View>
              <Switch
                value={settings.batteryOptimization}
                onValueChange={(v) => updateSetting('batteryOptimization', v)}
                trackColor={{ false: '#E0E0E0', true: '#4ECDC4' }}
                thumbColor={settings.batteryOptimization ? 'white' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{t('settings.notifications')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.notificationsDesc')}
                </Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(v) => updateSetting('notifications', v)}
                trackColor={{ false: '#E0E0E0', true: '#FFE66D' }}
                thumbColor={settings.notifications ? 'white' : '#999'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>{t('settings.dataPrivacy')}</Text>
            </View>

            <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
              <Download size={18} color={colors.textSecondary} />
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>{t('settings.exportData')}</Text>
                <Text style={styles.actionDescription}>
                  {t('settings.exportDesc')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                Alert.alert(
                  t('settings.privacyInfo'),
                  t('settings.privacyBody'),
                  [{ text: t('settings.gotIt'), style: "default" }]
                );
              }}
            >
              <Info size={18} color={colors.textSecondary} />
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>{t('settings.privacyInfo')}</Text>
                <Text style={styles.actionDescription}>
                  {t('settings.privacyDesc')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>{t('settings.disclaimerTitle')}</Text>
            <Text style={styles.disclaimerText}>
              {t('settings.disclaimerBody')}
            </Text>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>{t('settings.version')}</Text>
            <Text style={styles.versionSubtext}>{t('settings.madeWithLove')}</Text>
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
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.whiteTransparentHeavy,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.lg,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  sensitivityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  sensitivityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensitivityButtonText: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textSecondary,
  },
  sensitivityDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  sensitivityValue: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FF6B6B',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  languageValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FF6B6B',
  },
  languageList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(255,107,107,0.08)',
  },
  languageItemText: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-Regular',
    color: colors.textPrimary,
  },
  languageItemTextSelected: {
    fontFamily: 'Fredoka-SemiBold',
    color: '#FF6B6B',
  },
  languageCheck: {
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
  },
  disclaimerContainer: {
    backgroundColor: 'rgba(255,230,109,0.9)',
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#FFE66D',
  },
  disclaimerTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Fredoka-SemiBold',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  versionText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 3,
  },
  versionSubtext: {
    fontSize: fontSizes.xs,
    fontFamily: 'Fredoka-Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSizes.lg,
    fontFamily: 'Fredoka-Regular',
    color: colors.white,
    textAlign: 'center',
  },
});
