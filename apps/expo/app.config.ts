import type { ExpoConfig, ConfigContext } from "expo/config";

const APP_ENV = process.env.APP_ENV ?? "development";
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? "5ec536d8-f991-4779-88d7-c1b7fa595cb5";
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "VetTrack",
  slug: "vettrack-expo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "vettrack",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    // Parallel to Capacitor (uk.vettrack.app) during internal beta — separate install on device.
    bundleIdentifier: "uk.vettrack.expo",
    ...(APPLE_TEAM_ID ? { appleTeamId: APPLE_TEAM_ID } : {}),
    associatedDomains: ["applinks:vettrack.uk"],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NFCReaderUsageDescription:
        "VetTrack reads equipment NFC tags to record scans and checkout.",
    },
  },
  android: {
    package: "uk.vettrack.expo",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "vettrack.uk", pathPrefix: "/app" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "@vettrack/vettrack-control-plugin",
    [
      "react-native-nfc-manager",
      {
        nfcPermission: "VetTrack reads equipment NFC tags to record scans and checkout.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  updates: {
    url: process.env.EAS_UPDATE_URL ?? `https://u.expo.dev/${EAS_PROJECT_ID}`,
  },
  runtimeVersion: {
    policy: "fingerprint",
  },
});
