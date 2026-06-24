import { jest } from "@jest/globals";

// jest-expo already mocks much of React Native. These mocks cover the native
// modules the equipment-detail screen pulls in transitively (i18n storage,
// network status, NFC) plus expo-router and safe-area-context, mirroring the
// shapes in tests/mocks/*.ts but expressed as jest mocks.

// @react-native-async-storage/async-storage — backs the i18n locale store.
jest.mock("@react-native-async-storage/async-storage", () => {
  const storage = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: (key: string) => Promise.resolve(storage.get(key) ?? null),
      setItem: (key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        storage.delete(key);
        return Promise.resolve();
      },
    },
  };
});

// @react-native-community/netinfo — online/offline detection.
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
    addEventListener: () => () => {},
  },
}));

// react-native-nfc-manager — NFC hardware bridge.
jest.mock("react-native-nfc-manager", () => ({
  __esModule: true,
  Ndef: {
    TNF_WELL_KNOWN: 1,
    uri: { decodePayload: () => "" },
    text: { decodePayload: () => "" },
  },
  NfcTech: { Ndef: "Ndef" },
  default: {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    isSupported: () => Promise.resolve(true),
    requestTechnology: () => Promise.resolve(),
    cancelTechnologyRequest: () => Promise.resolve(),
    getTag: () => Promise.resolve({ id: "04123456", ndefMessage: [] }),
    setEventListener: () => {},
  },
}));

// expo-router — navigation. Individual tests override the return values.
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock("expo-router", () => ({
  __esModule: true,
  useLocalSearchParams: jest.fn(() => ({ id: "eq-1" })),
  useRouter: jest.fn(() => mockRouter),
}));

// react-native-safe-area-context — insets used by the screen layout.
jest.mock("react-native-safe-area-context", () => {
  const React = require("react") as typeof import("react");
  return {
    __esModule: true,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  };
});
