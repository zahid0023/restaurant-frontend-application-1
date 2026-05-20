"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
import { citiesService, type City } from "@/services/cities";
import { countriesService, type Country } from "@/services/countries";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

export default function CountryDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const countryId = Number(id);

  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citySearch, setCitySearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CityDialogMode>("create");
  const [activeCityId, setActiveCityId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<CityFormState>(emptyCityForm);

  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  async function fetchCountry() {
    try {
      const res = await countriesService.get(countryId);
      setCountry(res.country);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCities() {
    setCitiesLoading(true);
    try {
      const res = await citiesService.list(countryId, { size: 50 });
      setCities(res.data);
      setForm((prev) => {
        if (!dialogOpen || activeCityId == null) return prev;
        const updated = res.data.find((c) => c.id === activeCityId);
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
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCitiesLoading(false);
    }
  }

  useEffect(() => {
    fetchCountry();
    refreshCities();
    localesApi
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId]);

  const cityNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const c of cities) {
      out[c.id] = c.locales[0]?.name ?? "";
    }
    return out;
  }, [cities]);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => {
      const code = (c.code ?? "").toLowerCase();
      const name = (cityNames[c.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [cities, cityNames, citySearch]);

  function openCreate() {
    setMode("create");
    setActiveCityId(undefined);
    setForm(emptyCityForm);
    setDialogOpen(true);
  }

  function openDialog(c: City) {
    setMode("view");
    setActiveCityId(c.id);
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
    if (!deleteTarget) return;
    try {
      await citiesService.remove(countryId, deleteTarget.id);
      toast.success(t("cities.deleted"));
      setDeleteTarget(null);
      await refreshCities();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const localeName = country?.locales[0]?.name;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2"
        onClick={() => router.push("/countries")}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        {t("country.back")}
      </Button>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : !country ? (
        <p className="text-sm text-muted-foreground">{t("country.notFound")}</p>
      ) : (
        <>
          {/* Country Summary Card */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  {country.code}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{localeName ?? country.code}</h1>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">{country.code}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("field.iso3")}</p>
                <p className="font-semibold">{country.iso3_code ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("field.phone")}</p>
                <p className="font-semibold">{country.phone_code ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("field.sort")}</p>
                <p className="font-semibold">{country.sort_order}</p>
              </div>
            </div>
          </Card>

          {/* Cities */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{t("country.cities")}</h2>
                {cities.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{cities.length}</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={`${t("common.search")}…`}
                    className="pl-9 pr-9 w-48 h-9 text-sm"
                  />
                  {citySearch && (
                    <button
                      type="button"
                      onClick={() => setCitySearch("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" /> {t("cities.new")}
                </Button>
              </div>
            </div>

            {citiesLoading ? (
              <div className="flex justify-center py-12"><Spinner className="size-5" /></div>
            ) : filteredCities.length === 0 ? (
              <div className="flex justify-center py-12 text-sm text-muted-foreground border rounded-xl border-dashed">
                {citySearch ? t("cities.empty") : t("country.noCities")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCities.map((city) => (
                  <CityCard
                    key={city.id}
                    city={city}
                    defaultName={cityNames[city.id]}
                    onView={(c) => openDialog(c)}
                    onDelete={(c) => setDeleteTarget(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <CityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        countryId={countryId}
        cityId={activeCityId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={refreshCities}
      />

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
