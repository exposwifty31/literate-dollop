// Flat ESLint config for the literate-dollop workspace.
// Layers, in order: Expo's flat config, typescript-eslint recommended-type-checked,
// then eslint-config-prettier LAST to drop stylistic rules that conflict with Prettier.
import expoConfig from "eslint-config-expo/flat.js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // Globally ignored paths. JSON (locale files) are never linted.
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/dist/**",
      "**/coverage/**",
      "**/*.json",
      // Tooling config (babel/jest/fingerprint) lives outside any tsconfig, so
      // the type-aware project service cannot parse it. Not worth linting.
      "**/*.config.js",
    ],
  },
  // Only lint app, contracts, and scripts sources.
  {
    files: ["apps/expo/**", "packages/contracts/**", "scripts/**"],
    extends: [expoConfig, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Enables type-aware linting (e.g. no-floating-promises) without an
        // explicit project list — the parser resolves the nearest tsconfig.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // pnpm-workspace + the Expo/Metro resolver produce false positives for
      // workspace (`@vettrack/contracts`) and path-alias (`@/…`) imports that
      // the eslint import resolver cannot follow. Disabled to avoid noise.
      "import/no-unresolved": "off",
    },
  },
  // Prettier compatibility layer MUST be last so it can turn off any stylistic
  // rules enabled above that would conflict with Prettier formatting.
  eslintConfigPrettier,
);
