"use client";

import type { ReactNode } from "react";
import * as React from "react";
import type { Theme } from "@mui/material/styles";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { ptBR } from "date-fns/locale/pt-BR";

const localeText = {
  cancelButtonLabel: "Cancelar",
  okButtonLabel: "OK",
  clearButtonLabel: "Limpar",
  todayButtonLabel: "Hoje",
  datePickerToolbarTitle: "Selecionar data",
};

function useHtmlDarkClass(): boolean {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const el = document.documentElement;
    const read = () => setIsDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

function buildTheme(isDark: boolean) {
  return createTheme({
    cssVariables: true,
    palette: {
      mode: isDark ? "dark" : "light",
      primary: { main: isDark ? "#5a9a8f" : "#1f4b46" },
      background: {
        default: isDark ? "#0c0f0e" : "#f6f7f8",
        paper: isDark ? "#141a18" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f3f4f6" : "#111827",
        secondary: isDark ? "#9ca3af" : "#6b7280",
      },
      divider: isDark ? "#2a3430" : "#e5e7eb",
      action: {
        active: isDark ? "#9ca3af" : "#6b7280",
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    },
    components: {
      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => {
            const ring = theme.palette.mode === "dark" ? "rgba(90, 154, 143, 0.35)" : "rgba(31, 75, 70, 0.28)";
            return {
              borderRadius: Number(theme.shape.borderRadius),
              transition: theme.transitions.create(["border-color", "box-shadow"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
              "&.Mui-focused": {
                boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${ring}`,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderWidth: 1,
                borderColor: theme.palette.primary.main,
              },
            };
          },
          notchedOutline: ({ theme }: { theme: Theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            backgroundImage: "none",
            backgroundColor: theme.palette.background.paper,
          }),
        },
      },
    },
  });
}

export function MuiProvider({ children }: { children: ReactNode }) {
  const isDark = useHtmlDarkClass();
  const theme = React.useMemo(() => buildTheme(isDark), [isDark]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={ptBR}
        localeText={localeText}
      >
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
