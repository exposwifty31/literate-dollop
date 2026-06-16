const storage = new Map<string, string>();

const AsyncStorage = {
  getItem: (key: string) => Promise.resolve(storage.get(key) ?? null),
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};

export function clearMockAsyncStorage(): void {
  storage.clear();
}

export default AsyncStorage;
