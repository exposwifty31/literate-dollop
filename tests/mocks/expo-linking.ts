/** Vitest stub — avoids pulling react-native (Flow syntax) into Vite/Rollup. */

type ParsedURL = {
  hostname: string | null;
  path: string | null;
  queryParams: Record<string, string>;
  scheme: string | null;
};

export function parse(url: string): ParsedURL {
  const queryParams: Record<string, string> = {};
  let path: string | null = null;
  let hostname: string | null = null;
  let scheme: string | null = null;

  try {
    const parsed = new URL(url);
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = decodeURIComponent(value);
    });
    path = parsed.pathname || null;
    hostname = parsed.hostname || null;
    scheme = parsed.protocol ? parsed.protocol.slice(0, -1) : null;
  } catch {
    path = url;
  }

  if (path) {
    path = path.replace(/^\//, "");
  }

  return { hostname, path, queryParams, scheme };
}

export async function getInitialURL(): Promise<string | null> {
  return null;
}

export function addEventListener(
  _type: "url",
  _handler: (event: { url: string }) => void,
): { remove: () => void } {
  return { remove: () => {} };
}
