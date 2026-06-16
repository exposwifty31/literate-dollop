export type AuthHeaderProvider = () => Promise<Record<string, string>>;

let provider: AuthHeaderProvider = async () => ({});

export function setAuthHeaderProvider(fn: AuthHeaderProvider): void {
  provider = fn;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  return provider();
}
