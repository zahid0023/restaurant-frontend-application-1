"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Plus, Search, X } from "lucide-react";
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
import type { City } from "@/services/cities";
import { countriesService } from "@/services/countries";
import type { Country } from "@/services/countries";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";

export default function CitiesPage() {
  const { t } = useTranslation();

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CityDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<CityFormState>(emptyCityForm);

  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  useEffect(() => {
    countriesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setCountries(res.data))
      .catch(() => {});
    localesApi
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
  }, []);

  async function refresh(countryId: number) {
    setLoading(true);
    try {
      const res = await citiesService.list(countryId, { size: 50 });
      setCities(res.data);
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

  function handleCountryChange(val: string) {
    const id = Number(val);
    setSelectedCountryId(id);
    setSearch("");
    setCities([]);
    refresh(id);
  }

  const cityNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const c of cities) {
      out[c.id] = c.locales[0]?.name ?? "";
    }
    return out;
  }, [cities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => {
      const code = (c.code ?? "").toLowerCase();
      const name = (cityNames[c.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [cities, cityNames, search]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyCityForm);
    setDialogOpen(true);
  }

  function openDialog(c: City) {
    setMode("view");
    setActiveId(c.id);
    setForm({
      code: c.code ?? "",
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
    if (!deleteTarget || selectedCountryId == null) return;
    try {
      await citiesService.remove(selectedCountryId, deleteTarget.id);
      toast.success(t("cities.deleted"));
      setDeleteTarget(null);
      await refresh(selectedCountryId);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const selectedCountry = countries.find((c) => c.id === selectedCountryId);
  const selectedCountryName = selectedCountry
    ? (selectedCountry.locales[0]?.name ?? selectedCountry.code)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("cities.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("cities.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedCountryId ? String(selectedCountryId) : ""} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("cities.selectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.locales[0]?.name ?? c.code} ({c.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCountryId != null && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${t("common.search")}…`}
                  className="pl-9 pr-9 w-56"
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
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" /> {t("cities.new")}
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedCountryId == null ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-xl border-dashed gap-3">
          <MapPin className="h-8 w-8 opacity-30" />
          <p className="text-sm">{t("cities.selectCountry")}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("cities.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("cities.empty")}
        </div>
      ) : (
        <>
          {selectedCountryName && (
            <p className="text-sm text-muted-foreground">
              {t("cities.showingFor", { country: selectedCountryName })}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CityCard
                key={c.id}
                city={c}
                defaultName={cityNames[c.id]}
                onView={(city) => openDialog(city)}
                onDelete={(city) => setDeleteTarget(city)}
              />
            ))}
          </div>
        </>
      )}

      {selectedCountryId != null && (
        <CityDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={mode}
          countryId={selectedCountryId}
          cityId={activeId}
          form={form}
          onFormChange={setForm}
          availableLocales={availableLocales}
          onSaved={() => refresh(selectedCountryId)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.city.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.city.desc", { code: deleteTarget?.code ?? `#${deleteTarget?.id}` })}
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
