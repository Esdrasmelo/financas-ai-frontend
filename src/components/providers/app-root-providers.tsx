"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { MuiProvider } from "@/components/providers/mui-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppRootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <MuiProvider>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </MuiProvider>
    </AppRouterCacheProvider>
  );
}
