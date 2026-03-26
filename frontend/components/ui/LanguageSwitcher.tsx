"use client";

import { useI18nStore, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LANGUAGES: { key: Locale; label: string; flag: string }[] = [
  { key: "en", label: "English", flag: "🇺🇸" },
  { key: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.key}
          onClick={() => setLocale(lang.key)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
            locale === lang.key
              ? "bg-accent text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
