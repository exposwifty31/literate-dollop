import { useColorScheme } from "@/components/useColorScheme";
import { resolveTheme, type Theme } from "./theme";

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return resolveTheme(scheme);
}
