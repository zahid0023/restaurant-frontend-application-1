"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Plus, Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DishVariantCard } from "@/components/dishes/dish-variant-card";
import { DishVariantDialog } from "@/components/dishes/dish-variant-dialog";
import { dishesService, type DishDetail, type DishVariant, type DishVariantDetail } from "@/services/dishes";
import { localesApi, type Locale } from "@/services/locales";
import type { Unit } from "@/services/units";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function DishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const dishId = Number(idStr);
  const { t } = useTranslation();

  const [dish, setDish] = useState<DishDetail | null>(null);
  const [variants, setVariants] = useState<DishVariant[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [unitsByTypeId, setUnitsByTypeId] = useState<Record<number, Unit[]>>({});
  const [loading, setLoading] = useState(true);

  // Variant dialog
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantDialogMode, setVariantDialogMode] = useState<"create" | "view">("create");
  const [variantDialogTarget, setVariantDialogTarget] = useState<DishVariantDetail | undefined>(undefined);

  // Delete variant
  const [deleteTarget, setDeleteTarget] = useState<DishVariant | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [dishRes, variantsRes] = await Promise.all([
        dishesService.get(dishId),
        dishesService.listVariants(dishId, { size: 50, sort_by: "sortOrder" }),
      ]);
      setDish(dishRes.dish);
      setVariants(variantsRes.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!dishId) return;
    refresh();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishId]);

  function handleUnitTypeLoad(unitTypeId: number, units: Unit[]) {
    setUnitsByTypeId((prev) => ({ ...prev, [unitTypeId]: units }));
  }

  function openCreateVariant() {
    setVariantDialogTarget(undefined);
    setVariantDialogMode("create");
    setVariantDialogOpen(true);
  }

  async function openViewVariant(variant: DishVariant) {
    setVariantDialogMode("view");
    setVariantDialogTarget(variant);
    setVariantDialogOpen(true);
    try {
      const res = await dishesService.getVariant(dishId, variant.id);
      setVariantDialogTarget(res.dish_variant);
    } catch { /* keep partial */ }
  }

  async function confirmDeleteVariant() {
    if (!deleteTarget) return;
    try {
      await dishesService.removeVariant(dishId, deleteTarget.id);
      toast.success(t("dish.variantDeleted"));
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const displayName = dish?.locales?.[0]?.name?.trim() || dish?.code || `#${dishId}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back + header */}
      <div className="space-y-4">
        <Link
          href="/dishes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dish.backToDishes")}
        </Link>

        {dish ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground font-mono">{dish.code}</span>
              <Badge variant="secondary" className="text-xs">#{dish.sort_order}</Badge>
              {dish.is_featured && (
                <Badge variant="outline" className="gap-1 text-xs text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-400">
                  <Star className="h-3 w-3 fill-current" />
                  {t("dish.featured")}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="h-14 animate-pulse bg-muted rounded-lg" />
        )}
      </div>

      {/* Variants section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("dish.variants")}</h2>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {variants.length} variant{variants.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button onClick={openCreateVariant}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("dish.addVariant")}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : variants.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-muted-foreground border rounded-xl border-dashed">
            <UtensilsCrossed className="h-8 w-8 opacity-30" />
            <p className="text-sm">{t("dish.noVariants")}</p>
            <Button variant="outline" size="sm" onClick={openCreateVariant}>
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("dish.addVariant")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map((v) => (
              <DishVariantCard
                key={v.id}
                variant={v}
                availableLocales={availableLocales}
                unitsByTypeId={unitsByTypeId}
                onView={() => openViewVariant(v)}
                onDelete={() => setDeleteTarget(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Variant create / view dialog */}
      <DishVariantDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        mode={variantDialogMode}
        dishId={dishId}
        variant={variantDialogTarget}
        availableLocales={availableLocales}
        unitsByTypeId={unitsByTypeId}
        onUnitTypeLoad={handleUnitTypeLoad}
        onSaved={async () => {
          await refresh();
          if (variantDialogMode === "view" && variantDialogTarget) {
            const res = await dishesService.getVariant(dishId, variantDialogTarget.id).catch(() => null);
            if (res) setVariantDialogTarget(res.dish_variant);
          }
        }}
      />

      {/* Delete variant confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dish.deleteVariantTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dish.deleteVariantDesc", { code: deleteTarget?.code ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVariant}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
