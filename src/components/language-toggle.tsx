"use client";

import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS } from "@/i18n";
import { cn } from "@/lib/utils";

const LANG_LABELS: Record<string, string> = { en: "EN", bn: "বাং" };

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const switchLang = (lang: string) => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  };

  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5 text-xs font-medium">
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => switchLang(lang)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            current === lang
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LANG_LABELS[lang] ?? lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
