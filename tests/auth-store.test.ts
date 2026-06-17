import { describe, expect, it } from "vitest";
import {
  getAuthHeaders,
  getCurrentClinicId,
  getStoredBearerToken,
  setAuthState,
  setCurrentClinicId,
} from "@/lib/auth-store";

describe("auth-store", () => {
  it("emits a Bearer header only for JWT-shaped tokens", () => {
    setAuthState({ userId: "u1", email: "e", name: "n", bearerToken: "aaa.bbb.ccc" });
    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer aaa.bbb.ccc" });
  });

  it("rejects non-JWT tokens", () => {
    setAuthState({ userId: "u1", email: "e", name: "n", bearerToken: "not-a-jwt" });
    expect(getAuthHeaders()).toEqual({});
    expect(getStoredBearerToken()).toBeNull();
  });

  it("normalizes the clinic id", () => {
    setAuthState({ userId: "u1", email: "e", name: "n", bearerToken: null });
    setCurrentClinicId("  clinic-7  ");
    expect(getCurrentClinicId()).toBe("clinic-7");
    setCurrentClinicId();
    expect(getCurrentClinicId()).toBe("");
  });
});
