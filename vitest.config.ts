import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["apps/expo/src/**", "packages/contracts/src/**"],
      // React Native UI components are covered by jest-expo (not this vitest node suite)
      // and cannot run here without a full RN transform environment. Excluding them keeps
      // the threshold meaningful — they have their own coverage gate in jest.
      exclude: ["apps/expo/src/components/**"],
      // Seeded just below the measured baseline (stmts/lines 41.64, branches
      // 69.45, functions 80.72) so CI ratchets coverage up without breaking today.
      thresholds: {
        statements: 41,
        lines: 41,
        branches: 69,
        functions: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "apps/expo/src/lib"),
      "@/features": path.resolve(__dirname, "apps/expo/src/features"),
      "@/types": path.resolve(__dirname, "apps/expo/src/types"),
      "@/src/theme": path.resolve(__dirname, "apps/expo/src/theme"),
      "@/src/components": path.resolve(__dirname, "apps/expo/src/components"),
      "@vettrack/contracts": path.resolve(__dirname, "packages/contracts/src/index.ts"),
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "tests/mocks/async-storage.ts",
      ),
      "expo-linking": path.resolve(__dirname, "tests/mocks/expo-linking.ts"),
      "@react-native-community/netinfo": path.resolve(__dirname, "tests/mocks/netinfo.ts"),
      "react-native-nfc-manager": path.resolve(
        __dirname,
        "tests/mocks/react-native-nfc-manager.ts",
      ),
    },
  },
});
