import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { useLocaleId } from "@/lib/use-locale-id";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { restaurantBasicInfoService } from "@/services/restaurant-basic-info";
import { countriesService, type Country } from "@/services/countries";
import { citiesService, type City } from "@/services/cities";
import { toast } from "sonner";
import type { RestaurantFormState } from "./types";

interface LocalDraft {
  estd: number | "";
  lat: string;
  lon: string;
  phone: string;
  email: string;
  country: Country | null;
  city: City | null;
}

export interface RestaurantGeneralInfoProps {
  form: RestaurantFormState;
  onFormChange: (patch: Partial<RestaurantFormState>) => void;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
}

export function RestaurantGeneralInfo({
  form,
  onFormChange,
  onSaved,
  editing,
  onEditingChange,
}: RestaurantGeneralInfoProps) {
  const { t } = useTranslation();
  const localeId = useLocaleId();
  const [local, setLocal] = useState<LocalDraft>({
    estd: "", lat: "", lon: "", phone: "", email: "", country: null, city: null,
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getLocalizedName(locales: { locale_id: number; name: string }[], fallback: string) {
    return locales.find((l) => l.locale_id === localeId)?.name ?? locales[0]?.name ?? fallback;
  }

  async function startEdit() {
    setLocal({
      estd: form.estd,
      lat: form.lat,
      lon: form.lon,
      phone: form.phone,
      email: form.email,
      country: null,
      city: null,
    });
    setCountries([]);
    setCities([]);
    onEditingChange(true);

    // Load countries and cities in parallel
    setLoadingCountries(true);
    setLoadingCities(true);
    try {
      const [countriesRes, citiesRes] = await Promise.all([
        countriesService.list({ size: 50, sort_by: "id" }),
        citiesService.list(form.country.id, { size: 50, sort_by: "id" }),
      ]);
      setCountries(countriesRes.data);
      setCities(citiesRes.data);
      // Set draft country/city to the objects matching current form values
      const currentCountry = countriesRes.data.find((c) => c.id === form.country.id) ?? null;
      const currentCity = citiesRes.data.find((c) => c.id === form.city.id) ?? null;
      setLocal((prev) => ({ ...prev, country: currentCountry, city: currentCity }));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingCountries(false);
      setLoadingCities(false);
    }
  }

  async function handleCountryChange(countryId: string) {
    const country = countries.find((c) => String(c.id) === countryId) ?? null;
    setLocal((prev) => ({ ...prev, country, city: null }));
    setCities([]);
    if (!country) return;
    setLoadingCities(true);
    try {
      const res = await citiesService.list(country.id, { size: 50, sort_by: "id" });
      setCities(res.data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingCities(false);
    }
  }

  async function save() {
    if (local.estd === "" || isNaN(Number(local.estd))) {
      toast.error(t("restaurantInfo.errEstd"));
      return;
    }
    if (!local.country) { toast.error(t("restaurantInfo.errCountry")); return; }
    if (!local.city) { toast.error(t("restaurantInfo.errCity")); return; }
    setSubmitting(true);
    try {
      const parsedLat = local.lat.trim() !== "" ? parseFloat(local.lat) : undefined;
      const parsedLon = local.lon.trim() !== "" ? parseFloat(local.lon) : undefined;
      await restaurantBasicInfoService.update({
        estd: Number(local.estd),
        country_id: local.country.id,
        city_id: local.city.id,
        lat: parsedLat && !isNaN(parsedLat) ? parsedLat : undefined,
        lon: parsedLon && !isNaN(parsedLon) ? parsedLon : undefined,
        phone: local.phone || undefined,
        email: local.email || undefined,
      });
      toast.success(t("restaurantInfo.updatedToast"));
      onEditingChange(false);
      onFormChange({
        estd: Number(local.estd),
        lat: local.lat,
        lon: local.lon,
        phone: local.phone,
        email: local.email,
        country: {
          id: local.country.id,
          code: local.country.code,
          locales: local.country.locales.map((l) => ({ id: l.id, locale_id: l.locale_id, name: l.name })),
        },
        city: {
          id: local.city.id,
          code: local.city.code ?? "",
          locales: local.city.locales.map((l) => ({ id: l.id, locale_id: l.locale_id, name: l.name })),
        },
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const displayCountry = editing
    ? local.country
      ? `${getLocalizedName(local.country.locales, local.country.code)} (${local.country.code})`
      : ""
    : `${getLocalizedName(form.country.locales, form.country.code)} (${form.country.code})`;

  const displayCity = editing
    ? local.city
      ? `${getLocalizedName(local.city.locales, local.city.code ?? "")} (${local.city.code ?? ""})`
      : ""
    : `${getLocalizedName(form.city.locales, form.city.code)} (${form.city.code})`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          {/* Country */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("field.country")} {editing && "*"}</Label>
            {editing ? (
              <Select
                value={local.country ? String(local.country.id) : ""}
                onValueChange={handleCountryChange}
                disabled={loadingCountries}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCountries ? t("common.loading") : t("restaurantInfo.selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {getLocalizedName(c.locales, c.code)} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={displayCountry} disabled onChange={() => {}} />
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("restaurantInfo.city")} {editing && "*"}</Label>
            {editing ? (
              <Select
                value={local.city ? String(local.city.id) : ""}
                onValueChange={(v) => setLocal((prev) => ({ ...prev, city: cities.find((c) => String(c.id) === v) ?? null }))}
                disabled={loadingCities || !local.country}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCities ? t("common.loading") : t("restaurantInfo.selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {getLocalizedName(c.locales, c.code ?? "")} {c.code ? `(${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={displayCity} disabled onChange={() => {}} />
            )}
          </div>

          {/* Estd */}
          <div className="space-y-2">
            <Label htmlFor="rbi-estd" className="text-xs font-medium">{t("restaurantInfo.estd")} *</Label>
            <Input
              id="rbi-estd"
              type="number"
              value={editing ? (local.estd === "" ? "" : String(local.estd)) : (form.estd === "" ? "" : String(form.estd))}
              onChange={(e) => setLocal((p) => ({ ...p, estd: e.target.value === "" ? "" : Number(e.target.value) }))}
              disabled={!editing}
              placeholder="2020"
            />
          </div>

          {/* Lat */}
          <div className="space-y-2">
            <Label htmlFor="rbi-lat" className="text-xs font-medium">{t("restaurantInfo.lat")}</Label>
            <Input
              id="rbi-lat"
              type="number"
              value={editing ? local.lat : form.lat}
              onChange={(e) => setLocal((p) => ({ ...p, lat: e.target.value }))}
              disabled={!editing}
              placeholder="41.0082"
            />
          </div>

          {/* Lon */}
          <div className="space-y-2">
            <Label htmlFor="rbi-lon" className="text-xs font-medium">{t("restaurantInfo.lon")}</Label>
            <Input
              id="rbi-lon"
              type="number"
              value={editing ? local.lon : form.lon}
              onChange={(e) => setLocal((p) => ({ ...p, lon: e.target.value }))}
              disabled={!editing}
              placeholder="28.9784"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="rbi-phone" className="text-xs font-medium">{t("restaurantInfo.phone")}</Label>
            <Input
              id="rbi-phone"
              value={editing ? local.phone : form.phone}
              onChange={(e) => setLocal((p) => ({ ...p, phone: e.target.value }))}
              disabled={!editing}
              placeholder="+1 555 000 0000"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="rbi-email" className="text-xs font-medium">{t("restaurantInfo.email")}</Label>
            <Input
              id="rbi-email"
              type="email"
              value={editing ? local.email : form.email}
              onChange={(e) => setLocal((p) => ({ ...p, email: e.target.value }))}
              disabled={!editing}
              placeholder="info@restaurant.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
