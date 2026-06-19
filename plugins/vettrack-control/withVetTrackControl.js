// @ts-check
const withAppleTargets = require("@bacons/apple-targets/app.plugin");
const { withXcodeProject } = require("@expo/config-plugins");
const { getNativeTargets } = require("@expo/config-plugins/build/ios/Target");
const {
  getBuildConfigurationsForListId,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");

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

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withVetTrackControl = (config) => {
  config = withAppleTargets(config, {
    root: "../../plugins/vettrack-control",
    match: "*",
  });
  return withSyncedExtensionBuildNumber(config);
};

module.exports = withVetTrackControl;
