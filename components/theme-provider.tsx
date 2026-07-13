"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const storageKey = "romans.preferences.v1";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { theme?: Theme };
      if (parsed.theme === "dark" || parsed.theme === "light") return parsed.theme;
    }
  } catch {
    // Ignore malformed localStorage and fall back to the system preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function persistTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(storageKey);
    const current = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    window.localStorage.setItem(storageKey, JSON.stringify({ ...current, theme }));
  } catch {
    // Theme still applies even if storage is unavailable.
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readInitialTheme();
    applyTheme(initial);
    const id = window.setTimeout(() => {
      setThemeState(initial);
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    mounted,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark")
  }), [mounted, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useThemePreference must be used inside ThemeProvider");
  }
  return value;
}
