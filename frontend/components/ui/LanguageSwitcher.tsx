"use client";

import { useTranslation, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
            locale === code
              ? "bg-accent text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Compact toggle version for tight spaces */
export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  function toggle() {
    setLocale(locale === "en" ? "vi" : "en");
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
      aria-label="Switch language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="uppercase">{locale}</span>
    </button>
  );
}
