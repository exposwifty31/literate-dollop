/** @type {import('expo/fingerprint').Config} */
const config = {
  // ios.buildNumber is injected via EAS_BUILD_IOS_BUILD_NUMBER on EAS only.
  sourceSkips: ["ExpoConfigVersions"],

  // CNG project: native dirs are generated on EAS; local prebuild copies must not affect runtimeVersion.
  ignorePaths: ["ios", "android", "ios/**/*", "android/**/*"],

  fileHookTransform(source, chunk, isEndOfFile) {
    if (source.type !== "contents" || typeof chunk !== "string" || !isEndOfFile) {
      return chunk;
    }

    if (source.id === "expoConfig") {
      const normalized = JSON.parse(chunk);
      normalizeAssetPaths(normalized);
      return JSON.stringify(normalized);
    }

    if (
      source.id === "rncoreAutolinkingConfig:android" ||
      source.id === "rncoreAutolinkingConfig:ios"
    ) {
      return chunk.replace(
        /node_modules\/\.pnpm\/[^/]+\/node_modules\//g,
        "node_modules/",
      );
    }

    return chunk;
  },
};

/** @param {unknown} value */
function normalizeAssetPaths(value) {
  if (typeof value === "string") {
    return value.replace(/^\.\//, "");
  }
  if (Array.isArray(value)) {
    return value.map(normalizeAssetPaths);
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      // @ts-expect-error recursive walk
      value[key] = normalizeAssetPaths(value[key]);
    }
  }
  return value;
}

module.exports = config;
