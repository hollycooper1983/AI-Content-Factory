import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandSplash } from '@/components/brand-splash';
import { Button, Text } from '@/components/ui';
import { AppProvider, useApp } from '@/providers/app-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { palettes } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Public customer pages skip the owner-app logo reveal. */
const isPublicWebRoute =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  /^\/(b|manage|delete-account|privacy|terms|paid)(\/|$)/.test(window.location.pathname);

function Shell() {
  const { colors, scheme } = useTheme();
  const { ready } = useApp();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    // Hand off from the native splash to the animated reveal as soon as fonts exist.
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.background, card: colors.surface, primary: colors.primary, text: colors.text, border: colors.border },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(owner)" options={{ animation: 'fade' }} />
      </Stack>
      {isPublicWebRoute ? null : <BrandSplash ready={ready} />}
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <Shell />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Crash handling: any render error lands here instead of a blank screen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const c = palettes.light;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: c.background }}>
      <Text variant="title" style={{ color: c.text, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
        BookNoble hit an unexpected error. Your data is safe. {__DEV__ ? error.message : ''}
      </Text>
      <Button label="Try again" onPress={retry} />
    </View>
  );
}
