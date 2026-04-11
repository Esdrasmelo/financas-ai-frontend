"use client";

import * as React from "react";
import { useAuth } from "./auth-provider";
import { getApiBase, authFetch } from "@/lib/api";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h / 360) * 255);
  const b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function generatePalette(primary: string, accent: string, dark: boolean) {
  const p = hexToHsl(primary);
  const a = hexToHsl(accent);

  if (!dark) {
    return {
      "--primary": primary,
      "--primary-foreground": "#f9fafb",
      "--accent": accent,
      "--accent-foreground": hslToHex(a.h, Math.min(a.s + 0.2, 1), Math.max(a.l - 0.4, 0.1)),
      "--ring": primary,
      "--background": "#f6f7f8",
      "--foreground": "#111827",
      "--card": "#ffffff",
      "--card-foreground": "#111827",
      "--popover": "#ffffff",
      "--popover-foreground": "#111827",
      "--secondary": "#f1f3f5",
      "--secondary-foreground": "#111827",
      "--muted": "#f1f3f5",
      "--muted-foreground": "#6b7280",
      "--destructive": "#8b3a3a",
      "--destructive-foreground": "#fafafa",
      "--success": hslToHex(p.h, p.s * 0.8, 0.38),
      "--success-muted": hslToHex(p.h, 0.3, 0.92),
      "--border": "#e5e7eb",
      "--border-strong": "#d1d5db",
      "--input": "#e5e7eb",
    };
  }

  const darkPrimary = hslToHex(p.h, Math.min(p.s * 0.9, 0.5), 0.55);
  return {
    "--primary": darkPrimary,
    "--primary-foreground": "#0c0f0e",
    "--accent": hslToHex(a.h, a.s * 0.5, 0.22),
    "--accent-foreground": hslToHex(a.h, a.s * 0.6, 0.75),
    "--ring": darkPrimary,
    "--background": "#0c0f0e",
    "--foreground": "#f3f4f6",
    "--card": "#141a18",
    "--card-foreground": "#f3f4f6",
    "--popover": "#141a18",
    "--popover-foreground": "#f3f4f6",
    "--secondary": "#1c2421",
    "--secondary-foreground": "#e5e7eb",
    "--muted": "#1c2421",
    "--muted-foreground": "#9ca3af",
    "--destructive": "#c45c5c",
    "--destructive-foreground": "#fafafa",
    "--success": hslToHex(p.h, 0.4, 0.45),
    "--success-muted": hslToHex(p.h, 0.3, 0.12),
    "--border": "#2a3430",
    "--border-strong": "#3d4a45",
    "--input": "#2a3430",
  };
}

interface ThemeContextValue {
  mode: "light" | "dark";
  primary: string;
  accent: string;
  setTheme: (mode: "light" | "dark", primary: string, accent: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  mode: "light",
  primary: "#1f4b46",
  accent: "#dceae7",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [primary, setPrimary] = React.useState("#1f4b46");
  const [accent, setAccent] = React.useState("#dceae7");

  React.useEffect(() => {
    if (!user) return;
    setMode(user.themeMode === "dark" ? "dark" : "light");
    setPrimary(user.themePrimary || "#1f4b46");
    setAccent(user.themeAccent || "#dceae7");
  }, [user]);

  React.useEffect(() => {
    const root = document.documentElement;
    const isDark = mode === "dark";

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const vars = generatePalette(primary, accent, isDark);
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [mode, primary, accent]);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const setTheme = React.useCallback(
    (newMode: "light" | "dark", newPrimary: string, newAccent: string) => {
      setMode(newMode);
      setPrimary(newPrimary);
      setAccent(newAccent);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const base = getApiBase();
        void authFetch(`${base}/auth/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeMode: newMode,
            themePrimary: newPrimary,
            themeAccent: newAccent,
          }),
        });
      }, 600);
    },
    [],
  );

  const value = React.useMemo(() => ({ mode, primary, accent, setTheme }), [mode, primary, accent, setTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}
