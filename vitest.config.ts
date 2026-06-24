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
      "@/components/useColorScheme": path.resolve(
        __dirname,
        "tests/mocks/use-color-scheme.ts",
      ),
    },
  },
});
