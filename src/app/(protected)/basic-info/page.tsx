"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import { restaurantBasicInfoService, type RestaurantBasicInfo } from "@/services/restaurant-basic-info";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";
import type { RestaurantFormState } from "@/components/restaurant-basic-info/types";
import { RestaurantGeneralInfo } from "@/components/restaurant-basic-info/restaurant-general-info";
import { RestaurantLogoSection } from "@/components/restaurant-basic-info/restaurant-logo-section";
import { RestaurantLocaleTranslations } from "@/components/restaurant-basic-info/restaurant-locale-translations";

function infoToForm(info: RestaurantBasicInfo): RestaurantFormState {
  return {
    estd: info.estd,
    lat: info.lat != null ? String(info.lat) : "",
    lon: info.lon != null ? String(info.lon) : "",
    country: {
      id: info.country.id,
      code: info.country.code,
      locales: info.country.locales.map((l) => ({ id: l.id, locale_id: l.locale_id, name: l.name })),
    },
    city: {
      id: info.city.id,
      code: info.city.code,
      locales: info.city.locales.map((l) => ({ id: l.id, locale_id: l.locale_id, name: l.name })),
    },
    phone: info.phone ?? "",
    email: info.email ?? "",
    logo_url: info.logo_url ?? "",
    locales: info.locales.map((l) => ({
      id: l.id,
      locale_id: l.locale_id,
      name: l.name,
      short_description: l.short_description ?? "",
      address: l.address ?? "",
      sort_order: l.sort_order,
    })),
  };
}

export default function RestaurantBasicInfoPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RestaurantFormState | null>(null);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [logoEditing, setLogoEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);

  async function refresh() {
    try {
      const res = await restaurantBasicInfoService.get();
      setForm(infoToForm(res.restaurant_basic_info));
    } catch (err) {
      toast.error((err as Error).message);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("restaurantInfo.pageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("restaurantInfo.pageSubtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : !form ? (
        <p className="text-sm text-muted-foreground">{t("restaurantInfo.notFound")}</p>
      ) : (
        <div className="space-y-6">
          <RestaurantLogoSection
            form={form}
            onFormChange={(patch) => setForm((prev) => prev ? { ...prev, ...patch } : prev)}
            onSaved={refresh}
            editing={logoEditing}
            onEditingChange={setLogoEditing}
          />
          <RestaurantGeneralInfo
            form={form}
            onFormChange={(patch) => setForm((prev) => prev ? { ...prev, ...patch } : prev)}
            onSaved={refresh}
            editing={generalEditing}
            onEditingChange={setGeneralEditing}
          />
          <RestaurantLocaleTranslations
            form={form}
            availableLocales={availableLocales}
            onSaved={refresh}
            editing={translationsEditing}
            onEditingChange={setTranslationsEditing}
          />
        </div>
      )}
    </div>
  );
}
