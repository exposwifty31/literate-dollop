import { describe, expect, it } from "vitest";

import {
  buildSignInHref,
  pathFromDeepLinkUrl,
  resolvePostAuthHref,
  SCAN_DEEP_LINK_PATH,
} from "../apps/expo/src/lib/linking/deep-link-return";

describe("deep-link-return (Phase 2 widget handoff)", () => {
  it("maps vettrack-expo://scan to /scan", () => {
    expect(pathFromDeepLinkUrl("vettrack-expo://scan")).toBe(SCAN_DEEP_LINK_PATH);
  });

  it("maps legacy vettrack://scan for coexistence testing", () => {
    expect(pathFromDeepLinkUrl("vettrack://scan")).toBe(SCAN_DEEP_LINK_PATH);
  });

  it("returns undefined for unrelated URLs", () => {
    expect(pathFromDeepLinkUrl("vettrack-expo://account")).toBe("/account");
    expect(pathFromDeepLinkUrl(null)).toBeUndefined();
  });

  it("builds sign-in href with returnTo param", () => {
    expect(buildSignInHref(SCAN_DEEP_LINK_PATH)).toEqual({
      pathname: "/(auth)/sign-in",
      params: { returnTo: SCAN_DEEP_LINK_PATH },
    });
    expect(buildSignInHref()).toBe("/(auth)/sign-in");
  });

  it("resolves post-auth redirect to scan or home", () => {
    expect(resolvePostAuthHref(SCAN_DEEP_LINK_PATH)).toBe(SCAN_DEEP_LINK_PATH);
    expect(resolvePostAuthHref(undefined)).toBe("/(app)/(tabs)");
  });
});

// H6 cutover: Capacitor (uk.vettrack.app) and Expo (uk.vettrack.expo) coexist
// until the H7 kill-switch and may share the legacy `vettrack://` scheme. Lock
// the coexistence routing contract so the cutover does not silently break
// deep-links arriving from either build.
describe("deep-link scheme coexistence (H6 Capacitor ↔ Expo)", () => {
  it("routes the legacy vettrack:// scan link (host- and path-form) to /scan", () => {
    expect(pathFromDeepLinkUrl("vettrack://scan")).toBe(SCAN_DEEP_LINK_PATH);
    expect(pathFromDeepLinkUrl("vettrack:///scan")).toBe(SCAN_DEEP_LINK_PATH);
  });

  it("routes the new vettrack-expo:// scan link to /scan", () => {
    expect(pathFromDeepLinkUrl("vettrack-expo://scan")).toBe(SCAN_DEEP_LINK_PATH);
  });

  it("ignores empty/scheme-only deep links without misrouting", () => {
    expect(pathFromDeepLinkUrl("vettrack://")).toBeUndefined();
    expect(pathFromDeepLinkUrl(undefined)).toBeUndefined();
    expect(pathFromDeepLinkUrl("")).toBeUndefined();
  });
});
