import type { ExpoConfig, ConfigContext } from "expo/config";

const DEFAULT_EAS_PROJECT_ID = "5ec536d8-f991-4779-88d7-c1b7fa595cb5";
const IOS_ASSOCIATED_DOMAINS = ["applinks:vettrack.uk"];
export const LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN =
  "./plugins/with-local-development-ios-capability-strip.ts";

export function shouldUseProvisionedIosCapabilities(): boolean {
  return (
    process.env.EAS_BUILD === "true" ||
    process.env.VETTRACK_ENABLE_IOS_CAPABILITIES === "true" ||
    (process.env.APP_ENV ?? "development") !== "development"
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV ?? "development";
  const easProjectId = process.env.EAS_PROJECT_ID ?? DEFAULT_EAS_PROJECT_ID;
  const appleTeamId = process.env.APPLE_TEAM_ID;
  const useProvisionedIosCapabilities = shouldUseProvisionedIosCapabilities();

  return {
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
      ...(appleTeamId ? { appleTeamId } : {}),
      ...(useProvisionedIosCapabilities ? { associatedDomains: IOS_ASSOCIATED_DOMAINS } : {}),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NFCReaderUsageDescription: "VetTrack reads equipment NFC tags to record scans and checkout.",
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
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "@vettrack/vettrack-control-plugin",
      ...(useProvisionedIosCapabilities ? [] : [LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN]),
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
      appEnv,
      eas: {
        projectId: easProjectId,
      },
    },
    updates: {
      url: process.env.EAS_UPDATE_URL ?? `https://u.expo.dev/${easProjectId}`,
    },
    runtimeVersion: {
      policy: "fingerprint",
    },
  };
};
