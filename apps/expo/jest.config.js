/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // pnpm hoists deps under node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>, so the
  // default `node_modules/(?!…)` allowlist never matches (the segment after the first
  // `node_modules/` is always `.pnpm`). Anchor on `.pnpm/` and allow any path containing
  // an RN/Expo package substring — these ship untranspiled ESM (e.g. the jest-expo preset
  // imports `@react-native/js-polyfills`) and must be transformed.
  transformIgnorePatterns: [
    "node_modules/.pnpm/(?!(.*(react-native|@react-native|@react-navigation|react-navigation|expo|@expo|@expo-google-fonts|@unimodules|unimodules|sentry-expo|native-base)))",
  ],
  // Mirror apps/expo/tsconfig.json "paths" (longest-prefix first).
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/types$": "<rootDir>/src/types/index.ts",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/features/(.*)$": "<rootDir>/src/features/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/(.*)$": "<rootDir>/$1",
  },
};
