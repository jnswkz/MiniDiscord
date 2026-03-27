"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useI18nHydration } from "@/lib/i18n";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  useI18nHydration();
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
