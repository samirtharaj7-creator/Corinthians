"use client";

import { Moon, Sun } from "lucide-react";
import { useThemePreference } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { mounted, theme, toggleTheme } = useThemePreference();
  const dark = mounted ? theme === "dark" : false;
  return (
    <Button className="theme-word-toggle" variant="ghost" aria-label="Toggle theme" onClick={toggleTheme}>
      <span>{dark ? "Light" : "Dark"}</span>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
