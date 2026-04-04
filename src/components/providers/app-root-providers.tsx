"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { MuiProvider } from "@/components/providers/mui-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppRootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <MuiProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </MuiProvider>
    </AppRouterCacheProvider>
  );
}
