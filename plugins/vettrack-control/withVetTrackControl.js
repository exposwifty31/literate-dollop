// @ts-check
const withAppleTargets = require("@bacons/apple-targets/app.plugin");
const { withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const { getNativeTargets } = require("@expo/config-plugins/build/ios/Target");
const {
  getBuildConfigurationsForListId,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const fs = require("fs");
const path = require("path");

/**
 * @param {import("expo/config").ExpoConfig} config
 */
function resolveIosBuildNumber(config) {
  const fromConfig = config.ios?.buildNumber;
  if (fromConfig != null && fromConfig !== "") return String(fromConfig);
  const fromEas = process.env.EAS_BUILD_IOS_BUILD_NUMBER;
  if (fromEas) return String(fromEas);
  return "1";
}

/**
 * Apple-targets sets widget CURRENT_PROJECT_VERSION from config.ios.buildNumber || 1,
 * but EAS remote versioning only bumps the main app unless we propagate the same number.
 *
 * @param {import("expo/config").ExpoConfig} config
 */
function withSyncedExtensionBuildNumber(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const buildNumber = resolveIosBuildNumber(config);

    for (const [, nativeTarget] of getNativeTargets(project)) {
      const configurations = getBuildConfigurationsForListId(
        project,
        nativeTarget.buildConfigurationList,
      );
      for (const [, xcBuildConfiguration] of configurations) {
        if (!xcBuildConfiguration.buildSettings) {
          xcBuildConfiguration.buildSettings = {};
        }
        xcBuildConfiguration.buildSettings.CURRENT_PROJECT_VERSION = buildNumber;
      }
    }

    return config;
  });
}

/**
 * Expo Dev Launcher adds a release-cleanup script with no declared outputs.
 * Mark it as intentionally always-run so Xcode does not warn about ambiguous
 * build phase dependencies after every prebuild.
 *
 * @param {import("expo/config").ExpoConfig} config
 */
function withDevLauncherScriptDependencyAnalysisDisabled(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const xcodeProjectPath = path.join(
        config.modRequest.platformProjectRoot,
        `${config.modRequest.projectName}.xcodeproj`,
        "project.pbxproj",
      );
      let project = fs.readFileSync(xcodeProjectPath, "utf8");

      project = project.replace(
        /(\n\t\t[A-Z0-9]+ \/\* \[Expo Dev Launcher\] Strip Local Network Keys for Release \*\/ = \{\n\t\t\tisa = PBXShellScriptBuildPhase;\n)(?!\t\t\talwaysOutOfDate = 1;\n)/,
        "$1\t\t\talwaysOutOfDate = 1;\n",
      );

      fs.writeFileSync(xcodeProjectPath, project);
      return config;
    },
  ]);
}

/**
 * @param {import("expo/config").ExpoConfig} config
 */
function withGeneratedLibrarySearchPathsNormalized(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const xcodeProjectPath = path.join(
        config.modRequest.platformProjectRoot,
        `${config.modRequest.projectName}.xcodeproj`,
        "project.pbxproj",
      );
      const project = fs
        .readFileSync(xcodeProjectPath, "utf8")
        .replaceAll(
          'LIBRARY_SEARCH_PATHS = "$(SDKROOT)/usr/lib/swift\\"$(inherited)\\"";',
          'LIBRARY_SEARCH_PATHS = ("$(SDKROOT)/usr/lib/swift", "$(inherited)");',
        );

      fs.writeFileSync(xcodeProjectPath, project);
      return config;
    },
  ]);
}

/**
 * @param {import("expo/config").ExpoConfig} config
 */
function withGeneratedXcodeWarningFixes(config) {
  config = withDevLauncherScriptDependencyAnalysisDisabled(config);
  return withGeneratedLibrarySearchPathsNormalized(config);
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withVetTrackControl = (config) => {
  config = withAppleTargets(config, {
    root: "../../plugins/vettrack-control",
    match: "*",
  });
  config = withSyncedExtensionBuildNumber(config);
  return withGeneratedXcodeWarningFixes(config);
};

module.exports = withVetTrackControl;
