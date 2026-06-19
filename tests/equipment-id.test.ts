import { describe, expect, it } from "vitest";
import { extractEquipmentId, UNIVERSAL_LINK_HOST } from "@/lib/equipment-id";

describe("extractEquipmentId", () => {
  it("parses production universal link", () => {
    expect(extractEquipmentId("https://vettrack.uk/equipment/abc-123")).toBe("abc-123");
  });

  it("parses URL with query string", () => {
    expect(extractEquipmentId("https://vettrack.uk/equipment/abc-123?nfc=1")).toBe("abc-123");
  });

  it("accepts bare uuid", () => {
    expect(extractEquipmentId("eq-uuid-99")).toBe("eq-uuid-99");
  });

  it("returns null for empty", () => {
    expect(extractEquipmentId("")).toBeNull();
    expect(extractEquipmentId("   ")).toBeNull();
  });

  it("exports canonical host constant", () => {
    expect(UNIVERSAL_LINK_HOST).toBe("vettrack.uk");
  });
});
