import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "apps/expo/src/lib"),
      "@vettrack/contracts": path.resolve(__dirname, "packages/contracts/src/index.ts"),
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "tests/mocks/async-storage.ts",
      ),
    },
  },
});
