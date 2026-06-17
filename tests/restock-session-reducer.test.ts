import { describe, expect, it } from "vitest";
import {
  initialRestockSessionState,
  restockSessionReducer,
  type RestockSessionState,
} from "@/features/inventory/restock-session-reducer";

describe("restockSessionReducer", () => {
  it("marks the session busy and clears errors on a start request", () => {
    const state = restockSessionReducer(
      { ...initialRestockSessionState, errorMessage: "old" },
      { type: "start-request" },
    );
    expect(state.isBusy).toBe(true);
    expect(state.errorMessage).toBeNull();
  });

  it("records the active session and container on start-success", () => {
    const state = restockSessionReducer(initialRestockSessionState, {
      type: "start-success",
      payload: { sessionId: "s1", containerId: "c1" },
    });
    expect(state.activeSessionId).toBe("s1");
    expect(state.activeContainerId).toBe("c1");
    expect(state.isBusy).toBe(false);
  });

  it("clears the active session and stores the summary on finish-success", () => {
    const open: RestockSessionState = {
      activeSessionId: "s1",
      activeContainerId: "c1",
      isBusy: true,
      errorMessage: null,
      lastSummary: null,
    };
    const state = restockSessionReducer(open, {
      type: "finish-success",
      payload: { totalAdded: 3, totalRemoved: 1, itemsMissingCount: 0 },
    });
    expect(state.activeSessionId).toBeNull();
    expect(state.activeContainerId).toBeNull();
    expect(state.lastSummary).toEqual({ totalAdded: 3, totalRemoved: 1, itemsMissingCount: 0 });
  });

  it("surfaces the failure message and stops being busy on failure", () => {
    const state = restockSessionReducer(
      { ...initialRestockSessionState, isBusy: true },
      { type: "failure", payload: { message: "scan rejected" } },
    );
    expect(state.isBusy).toBe(false);
    expect(state.errorMessage).toBe("scan rejected");
  });

  it("does not mutate the input state object", () => {
    const frozen = Object.freeze({ ...initialRestockSessionState });
    expect(() => restockSessionReducer(frozen, { type: "scan-request" })).not.toThrow();
  });
});
