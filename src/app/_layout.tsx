import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettings } from '../store/settings';
import { colors } from '../ui/theme';

void SplashScreen.preventAutoHideAsync();

/** Wacht tot de opgeslagen instellingen van schijf geladen zijn. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSettings.persist.onFinishHydration(onChange),
    () => useSettings.persist.hasHydrated(),
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  const hydrated = useHydrated();
  // Als het font niet laadt, gaan we door met het systeemfont.
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: 'Geist_600SemiBold' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="week" options={{ headerShown: true, title: 'Week' }} />
        <Stack.Screen name="detail/[signal]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="sources" options={{ headerShown: true, title: 'Bronnen' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Instellingen' }} />
        <Stack.Screen name="about" options={{ headerShown: true, title: 'Over FitBuddy' }} />
        <Stack.Screen name="playground" options={{ headerShown: true, title: 'Speeltuin' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
