import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EquipmentDetailScreen from "../[id]";
import { fetchEquipmentById } from "@/lib/api/equipment-list";
import { useRouter } from "expo-router";
import { t } from "@/lib/i18n";
import { statusLabel } from "@/constants/statusColors";
import type { Equipment } from "@/types/equipment";

// The screen loads its data through fetchEquipmentById; mock that module so
// each test drives the resolve/reject outcome.
jest.mock("@/lib/api/equipment-list");

const mockedFetch = jest.mocked(fetchEquipmentById);
// useRouter is mocked in jest.setup.ts to return a stable router object.
const mockedRouter = jest.mocked(useRouter)();

function buildEquipment(overrides: Partial<Equipment> = {}): Equipment {
  return {
    id: "eq-1",
    name: "Anesthesia Machine",
    status: "ok",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("EquipmentDetailScreen", () => {
  it("shows the load-failure message and retries on press", async () => {
    mockedFetch.mockRejectedValue(new Error("network down"));

    render(<EquipmentDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(t.equipmentDetail.loadFailed)).toBeTruthy();
    });

    // The first load attempt fired in the mount effect.
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    // Pressing "try again" re-invokes the loader (retry path).
    fireEvent.press(screen.getByText(t.common.tryAgain));

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    // Still showing the error, never crashed.
    expect(screen.getByText(t.equipmentDetail.loadFailed)).toBeTruthy();
  });

  it("renders the equipment name and resolved status label", async () => {
    const equipment = buildEquipment();
    mockedFetch.mockResolvedValue(equipment);

    render(<EquipmentDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(equipment.name)).toBeTruthy();
    });

    // Resolved status label (Hebrew default locale — referenced via the same
    // helper the screen uses, never hardcoded copy).
    expect(screen.getByText(statusLabel(equipment.status))).toBeTruthy();
  });

  it("navigates to the scan screen when the scan button is pressed", async () => {
    mockedFetch.mockResolvedValue(buildEquipment());

    render(<EquipmentDetailScreen />);

    const scanButton = await waitFor(() => screen.getByText(t.nav.equipmentScan));

    fireEvent.press(scanButton);
    expect(mockedRouter.push).toHaveBeenCalledWith("/scan");
  });

  it("renders the checked-out banner when checkedOutByEmail is set", async () => {
    const checkedOutByEmail = "vet@clinic.test";
    const equipment = buildEquipment({
      checkedOutById: "user-9",
      checkedOutByEmail,
    });
    mockedFetch.mockResolvedValue(equipment);

    render(<EquipmentDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(t.equipmentDetail.checkedOutBy(checkedOutByEmail))).toBeTruthy();
    });
  });
});
