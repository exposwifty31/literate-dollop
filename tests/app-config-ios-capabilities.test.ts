import { afterEach, describe, expect, it } from "vitest";

import createExpoConfig, {
  LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN,
  shouldUseProvisionedIosCapabilities,
} from "../apps/expo/app.config";

const ORIGINAL_ENV = { ...process.env };

describe("Expo iOS capabilities config", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("strips provisioned-only iOS capabilities for local development builds", () => {
    delete process.env.APP_ENV;
    delete process.env.EAS_BUILD;
    delete process.env.VETTRACK_ENABLE_IOS_CAPABILITIES;

    const config = createExpoConfig({ config: {} });

    expect(shouldUseProvisionedIosCapabilities()).toBe(false);
    expect(config.ios?.associatedDomains).toBeUndefined();
    expect(config.plugins).toContain(LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN);
    expect(config.plugins?.indexOf(LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN)).toBeLessThan(
      config.plugins?.findIndex((plugin) => Array.isArray(plugin) && plugin[0] === "react-native-nfc-manager"),
    );
  });

  it("keeps provisioned-only iOS capabilities for EAS development builds", () => {
    process.env.APP_ENV = "development";
    process.env.EAS_BUILD = "true";

    const config = createExpoConfig({ config: {} });

    expect(shouldUseProvisionedIosCapabilities()).toBe(true);
    expect(config.ios?.associatedDomains).toEqual(["applinks:vettrack.uk"]);
    expect(config.plugins).not.toContain(LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN);
  });

  it("allows local development builds to opt into provisioned iOS capabilities", () => {
    process.env.APP_ENV = "development";
    process.env.VETTRACK_ENABLE_IOS_CAPABILITIES = "true";

    const config = createExpoConfig({ config: {} });

    expect(shouldUseProvisionedIosCapabilities()).toBe(true);
    expect(config.ios?.associatedDomains).toEqual(["applinks:vettrack.uk"]);
    expect(config.plugins).not.toContain(LOCAL_DEVELOPMENT_IOS_CAPABILITY_STRIP_PLUGIN);
  });
});
