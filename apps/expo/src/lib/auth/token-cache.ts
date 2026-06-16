import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/clerk-expo";

export const clerkTokenCache: TokenCache = {
  async getToken(key) {
    try {
      return (await SecureStore.getItemAsync(key)) ?? null;
    } catch {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Best-effort — dev simulators may lack secure enclave.
    }
  },
};
