import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/hooks/useLanguage';
import { SplashScreen } from '@/components/SplashScreen';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <LanguageProvider>
      <ErrorBoundary>
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <SplashScreen />
        </>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
