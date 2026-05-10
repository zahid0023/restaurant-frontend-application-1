"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { localesApi, type Locale } from "@/services/locales"

export function LocaleToggle() {
  const { i18n } = useTranslation()
  const [locales, setLocales] = useState<Locale[]>([])

  useEffect(() => {
    localesApi.list({ size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => setLocales(res.data))
      .catch(() => {})
  }, [])

  if (locales.length === 0) return null

  const current = i18n.resolvedLanguage ?? i18n.language

  const handleChange = async (code: string) => {
    localStorage.setItem("app.lang", code)
    await i18n.changeLanguage(code)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-auto border-0 bg-transparent px-2 shadow-none focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((locale) => (
          <SelectItem key={locale.id} value={locale.code}>
            {locale.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
