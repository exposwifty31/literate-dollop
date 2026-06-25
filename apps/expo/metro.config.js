const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro picks up packages/ and apps/ siblings.
config.watchFolders = [monorepoRoot];

// Resolve modules from the app's own node_modules first, then the workspace root.
// pnpm hoists shared deps to the root; the app's own direct deps live in apps/expo/node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
