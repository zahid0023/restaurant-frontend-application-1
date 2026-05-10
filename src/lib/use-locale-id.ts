"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { localesApi } from "@/services/locales";

// Module-level cache shared across all component instances.
let localeCache: Array<{ id: number; code: string }> | null = null;
let fetchPromise: Promise<void> | null = null;

/**
 * Returns the backend locale_id that corresponds to the current UI language.
 * Resolves by matching i18n.language against locale.code from the /locales API.
 * Falls back to 1 (English) while the first fetch is in flight.
 */
export function useLocaleId(): number {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? "en")
    .split("-")[0]
    .toLowerCase();

  const [localeId, setLocaleId] = useState<number>(1);

  useEffect(() => {
    const resolve = (locales: Array<{ id: number; code: string }>) => {
      const match = locales.find((l) => l.code.toLowerCase() === lang);
      setLocaleId(match?.id ?? 1);
    };

    if (localeCache) {
      resolve(localeCache);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = localesApi
        .list({ size: 50 })
        .then((res) => {
          localeCache = res.data.map((l) => ({ id: l.id, code: l.code }));
        })
        .catch(() => {
          fetchPromise = null; // allow retry on next render
        });
    }

    void fetchPromise.then(() => {
      if (localeCache) resolve(localeCache);
    });
  }, [lang]);

  return localeId;
}
