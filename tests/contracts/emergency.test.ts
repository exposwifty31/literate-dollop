import { describe, expect, it } from "vitest";
import {
  EMERGENCY_OFFLINE_BLOCK_MUTATIONS,
  classifyEmergencyEndpointFromManifest,
  normalizeEmergencyPathname,
} from "@vettrack/contracts";

describe("@vettrack/contracts emergency shapes", () => {
  it("manifest lists four offline-block mutations", () => {
    expect(EMERGENCY_OFFLINE_BLOCK_MUTATIONS).toHaveLength(4);
    expect(EMERGENCY_OFFLINE_BLOCK_MUTATIONS.map((e) => e.class).sort()).toEqual([
      "end",
      "log",
      "presence",
      "start",
    ]);
  });

  it("normalizeEmergencyPathname strips trailing slashes", () => {
    expect(normalizeEmergencyPathname("/api/code-blue/sessions/")).toBe(
      "/api/code-blue/sessions",
    );
  });

  it("classifyEmergencyEndpointFromManifest blocks mutations only", () => {
    expect(
      classifyEmergencyEndpointFromManifest("/api/code-blue/sessions", "POST"),
    ).toBe("start");
    expect(
      classifyEmergencyEndpointFromManifest("/api/code-blue/sessions/active", "GET"),
    ).toBeNull();
  });
});
