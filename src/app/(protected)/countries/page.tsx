"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CountryCard } from "@/components/countries/country-card";
import { CountryDialog, emptyCountryForm } from "@/components/countries/country-dialog";
import type { CountryDialogMode, CountryFormState } from "@/components/countries/types";
import { countriesService, type Country } from "@/services/countries";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

type SearchField = "all" | "code" | "iso3" | "phone" | "name";

export default function CountriesPage() {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CountryDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<CountryFormState>(emptyCountryForm);

  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await countriesService.list({ size: 50, sort_by: "sortOrder" });
      setCountries(res.data);
      setForm((prev) => {
        if (!dialogOpen || activeId == null) return prev;
        const updated = res.data.find((c) => c.id === activeId);
        if (!updated) return prev;
        return {
          ...prev,
          locales: updated.locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description ?? "",
            sort_order: l.sort_order,
          })),
        };
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    localesApi
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countryNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const c of countries) {
      out[c.id] = c.locales[0]?.name ?? "";
    }
    return out;
  }, [countries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const code = c.code.toLowerCase();
      const iso3 = (c.iso3_code ?? "").toLowerCase();
      const phone = (c.phone_code ?? "").toLowerCase();
      const name = (countryNames[c.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "iso3": return iso3.includes(q);
        case "phone": return phone.includes(q);
        case "name": return name.includes(q);
        default:
          return code.includes(q) || iso3.includes(q) || phone.includes(q) || name.includes(q);
      }
    });
  }, [countries, countryNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyCountryForm);
    setDialogOpen(true);
  }

  function openDialog(c: Country) {
    setMode("view");
    setActiveId(c.id);
    setForm({
      code: c.code,
      iso3_code: c.iso3_code ?? "",
      phone_code: c.phone_code ?? "",
      sort_order: c.sort_order,
      locales: c.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await countriesService.remove(deleteTarget.id);
      toast.success(t("delete.country.title") + ": " + deleteTarget.code);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("countries.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("countries.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-stretch">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
              <SelectTrigger className="w-36 h-10 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allFields")}</SelectItem>
                <SelectItem value="code">{t("common.code")}</SelectItem>
                <SelectItem value="iso3">{t("field.iso3")}</SelectItem>
                <SelectItem value="phone">{t("field.phone")}</SelectItem>
                <SelectItem value="name">{t("common.localizedName")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.search")} ${searchField === "all" ? t("common.allFields") : searchField}…`}
                className="pl-9 pr-9 w-64 h-10 rounded-l-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("countries.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("countries.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("countries.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CountryCard
              key={c.id}
              country={c}
              defaultName={countryNames[c.id]}
              onView={(country) => openDialog(country)}
              onDelete={(country) => setDeleteTarget(country)}
            />
          ))}
        </div>
      )}

      <CountryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        countryId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.country.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.country.desc", { code: deleteTarget?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
