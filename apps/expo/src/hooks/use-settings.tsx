import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { applyLocaleDirection, setStoredLocale } from "@/lib/i18n";
import {
  DEFAULT_USER_SETTINGS,
  getStoredUserSettings,
  saveStoredUserSettings,
  type ColorTheme,
  type DateFormat,
  type Density,
  type TimeFormat,
  type UserSettings,
} from "@/lib/user-settings-storage";

export type { ColorTheme, DateFormat, Density, TimeFormat };
export type Settings = UserSettings;

/**
 * Settings context — ported from web `use-settings`. The web version applied
 * theme/density/brightness imperatively to `document` (DOM); in RN those are
 * consumed from context by styled components, so the DOM side-effects are
 * dropped. Only locale application (which has an RN equivalent via
 * `I18nManager`) is kept.
 */
function applyLocaleSettings(settings: Settings): void {
  const locale = setStoredLocale(settings.locale);
  applyLocaleDirection(locale);
}

interface SettingsContextType {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_USER_SETTINGS,
  update: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const loaded = getStoredUserSettings();
    applyLocaleSettings(loaded);
    return loaded;
  });

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveStoredUserSettings(next);
      applyLocaleSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveStoredUserSettings(DEFAULT_USER_SETTINGS);
    applyLocaleSettings(DEFAULT_USER_SETTINGS);
    setSettings(DEFAULT_USER_SETTINGS);
  }, []);

  useEffect(() => {
    applyLocaleSettings(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
