import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PLUGIN_IOS = join(process.cwd(), "plugins/vettrack-control/ios");

describe("VetTrackControl plugin (Phase 2)", () => {
  it("registers the expo control widget kind for uk.vettrack.expo", () => {
    const swift = readFileSync(join(PLUGIN_IOS, "VetTrackScanControl.swift"), "utf8");
    expect(swift).toContain('static let kind = "uk.vettrack.expo.control.scan"');
  });

  it("opens vettrack://scan from the App Intent", () => {
    const intent = readFileSync(join(PLUGIN_IOS, "_shared/OpenScanIntent.swift"), "utf8");
    expect(intent).toContain('URL(string: "vettrack://scan")');
    expect(intent).toContain("ControlConfigurationIntent");
  });

  it("targets iOS 18 control widgets via WidgetKit extension", () => {
    const plist = readFileSync(join(PLUGIN_IOS, "Info.plist"), "utf8");
    expect(plist).toContain("com.apple.widgetkit-extension");
    const config = readFileSync(join(PLUGIN_IOS, "expo-target.config.js"), "utf8");
    expect(config).toContain('deploymentTarget: "18.0"');
    expect(config).toContain('bundleIdentifier: ".control"');
  });

  it("syncs extension CURRENT_PROJECT_VERSION with EAS / ios.buildNumber", () => {
    const plugin = readFileSync(
      join(process.cwd(), "plugins/vettrack-control/withVetTrackControl.js"),
      "utf8",
    );
    expect(plugin).toContain("withSyncedExtensionBuildNumber");
    expect(plugin).toContain("EAS_BUILD_IOS_BUILD_NUMBER");
    expect(plugin).toContain("CURRENT_PROJECT_VERSION");
  });
});
