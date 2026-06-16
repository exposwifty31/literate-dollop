import type { ExpoConfig, ConfigContext } from "expo/config";

const APP_ENV = process.env.APP_ENV ?? "development";

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
    associatedDomains: ["applinks:vettrack.uk"],
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
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  updates: {
    url: process.env.EAS_UPDATE_URL,
  },
  runtimeVersion: {
    policy: "fingerprint",
  },
});
