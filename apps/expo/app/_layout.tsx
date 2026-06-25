import {
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
  Heebo_700Bold,
} from "@expo-google-fonts/heebo";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { useSync } from "@/hooks/use-sync";
import { isClerkActive } from "@/lib/auth/clerk-config";
import {
  useSyncAuthBridgeWithClerk,
  useSyncAuthBridgeWithoutClerk,
} from "@/hooks/use-sync-auth-bridge";
import { usePendingSyncStartup } from "@/lib/offline/use-pending-sync-startup";
import { VetTrackClerkProvider } from "@/src/providers/clerk-provider";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(app)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  usePendingSyncStartup();
  useSync();

  return (
    <VetTrackClerkProvider>
      <SyncAuthBridge />
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </ThemeProvider>
    </VetTrackClerkProvider>
  );
}

function SyncAuthBridge() {
  if (isClerkActive) {
    return <SyncAuthBridgeClerk />;
  }
  return <SyncAuthBridgeFallback />;
}

function SyncAuthBridgeClerk() {
  useSyncAuthBridgeWithClerk();
  return null;
}

function SyncAuthBridgeFallback() {
  useSyncAuthBridgeWithoutClerk();
  return null;
}
