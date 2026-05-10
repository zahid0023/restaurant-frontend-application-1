"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CityCard } from "@/components/cities/city-card";
import { CityDialog, emptyCityForm } from "@/components/cities/city-dialog";
import type { CityDialogMode, CityFormState } from "@/components/cities/types";
import { citiesService } from "@/services/cities";
import type { City, CityLocale } from "@/services/cities";
import { countriesService } from "@/services/countries";
import type { Country } from "@/services/countries";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name" | "country";

export default function CitiesPage() {
  const { t } = useTranslation();

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("common.allFields"),
    code: t("common.code"),
    name: t("common.localizedName"),
    country: t("field.country"),
  };

  const [cities, setCities] = useState<City[]>([]);
  const [cityLocaleRows, setCityLocaleRows] = useState<Record<number, CityLocale[]>>({});
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CityDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<CityFormState>(emptyCityForm);

  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await citiesService.list({ size: 50, sort_by: "sortOrder" });
      setCities(res.data);
      const entries = await Promise.all(
        res.data.map(async (c) => {
          try {
            const loc = await citiesService.listLocales(c.id, { size: 50, sort_by: "sortOrder", sort_dir: "ASC" });
            return [c.id, loc.data] as const;
          } catch {
            return [c.id, [] as CityLocale[]] as const;
          }
        }),
      );
      setCityLocaleRows(Object.fromEntries(entries));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((res) => setAvailableLocales(res.data)).catch(() => {});
    countriesService.list({ size: 50, sort_by: "sortOrder" }).then((res) => setAvailableCountries(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cityNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const [id, rows] of Object.entries(cityLocaleRows)) {
      out[Number(id)] = rows[0]?.name ?? "";
    }
    return out;
  }, [cityLocaleRows]);

  const countriesMap = useMemo(() => {
    const out: Record<number, Country> = {};
    for (const c of availableCountries) out[c.id] = c;
    return out;
  }, [availableCountries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => {
      const code = (c.code ?? "").toLowerCase();
      const name = (cityNames[c.id] ?? "").toLowerCase();
      const country = (countriesMap[c.country_id]?.code ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        case "country": return country.includes(q);
        default: return code.includes(q) || name.includes(q) || country.includes(q);
      }
    });
  }, [cities, cityNames, countriesMap, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyCityForm);
    setDialogOpen(true);
  }

  async function openDetail(c: City, nextMode: "edit" | "view") {
    setMode(nextMode);
    setActiveId(c.id);
    setForm({
      country_id: c.country_id,
      code: c.code ?? "",
      sort_order: c.sort_order,
      locales: [],
    });
    setDialogOpen(true);
    try {
      const res = await citiesService.listLocales(c.id, { size: 50 });
      setForm((f) => ({
        ...f,
        locales: res.data.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      }));
    } catch {
      /* non-blocking */
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await citiesService.remove(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.code ?? `City #${deleteTarget.id}`}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("cities.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("cities.subtitle")}</p>
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
                <SelectItem value="name">{t("common.localizedName")}</SelectItem>
                <SelectItem value="country">{t("field.country")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.search")} ${searchFieldLabels[searchField].toLowerCase()}…`}
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
            <Plus className="h-4 w-4 mr-1.5" /> {t("cities.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("cities.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("cities.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CityCard
              key={c.id}
              city={c}
              defaultName={cityNames[c.id]}
              countryLabel={countriesMap[c.country_id]?.code}
              onView={(city) => openDetail(city, "view")}
              onEdit={(city) => openDetail(city, "edit")}
              onDelete={(city) => setDeleteTarget(city)}
            />
          ))}
        </div>
      )}

      <CityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        onModeChange={setMode}
        cityId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        availableCountries={availableCountries}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.city.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.city.desc", { code: deleteTarget?.code ?? `City #${deleteTarget?.id}` })}
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
