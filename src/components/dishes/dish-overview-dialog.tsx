"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Layers, Plus, UtensilsCrossed, X } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { dishesService } from "@/services/dishes";
import type { Dish, DishDetail, DishVariant } from "@/services/dishes";
import type { Unit } from "@/services/units";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";
import { DishVariantDialog } from "./dish-variant-dialog";
import { DishVariantCard } from "./dish-variant-card";

export interface DishOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: Dish | null;
  dishName?: string;
}

export function DishOverviewDialog({
  open,
  onOpenChange,
  dish,
  dishName,
}: DishOverviewDialogProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<DishDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Variant dialog
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantDialogMode, setVariantDialogMode] = useState<"create" | "view">("create");
  const [variantDialogTarget, setVariantDialogTarget] = useState<DishVariant | undefined>(undefined);

  // Variant delete confirm
  const [deleteTarget, setDeleteTarget] = useState<DishVariant | null>(null);

  // Supporting data
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [unitsByTypeId, setUnitsByTypeId] = useState<Record<number, Unit[]>>({});

  useEffect(() => {
    if (!open || !dish) {
      setDetail(null);
      setVariantDialogOpen(false);
      setDeleteTarget(null);
      return;
    }
    fetchDetail(dish.id);
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish?.id]);

  async function fetchDetail(id: number) {
    setLoading(true);
    setDetail(null);
    try {
      const [dishRes, variantsRes] = await Promise.all([
        dishesService.get(id),
        dishesService.listVariants(id, { size: 50, sort_by: "sortOrder" }),
      ]);
      setDetail({ ...dishRes.dish, variants: variantsRes.data });
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  function handleUnitTypeLoad(unitTypeId: number, units: Unit[]) {
    setUnitsByTypeId((prev) => ({ ...prev, [unitTypeId]: units }));
  }

  function openCreateVariantDialog() {
    setVariantDialogTarget(undefined);
    setVariantDialogMode("create");
    setVariantDialogOpen(true);
  }

  async function openViewVariantDialog(variant: DishVariant) {
    if (!dish) return;
    setVariantDialogMode("view");
    setVariantDialogTarget(variant);
    setVariantDialogOpen(true);
    try {
      const res = await dishesService.getVariant(dish.id, variant.id);
      setVariantDialogTarget(res.dish_variant);
    } catch { /* keep partial data */ }
  }

  async function confirmDeleteVariant() {
    if (!dish || !deleteTarget) return;
    try {
      await dishesService.removeVariant(dish.id, deleteTarget.id);
      toast.success(t("dish.variantDeleted"));
      setDeleteTarget(null);
      await fetchDetail(dish.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!open || !dish) return null;

  const displayName = dishName?.trim() || dish.code;
  const initials = dish.code.slice(0, 3).toUpperCase();
  const variants = detail?.variants ?? [];

  return (
    <>
      <div className="absolute inset-0 flex flex-col bg-background animate-in fade-in-0 slide-in-from-right-4 duration-200">

        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-5 pb-4 shrink-0">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Back" onClick={() => onOpenChange(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight truncate">{displayName}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                      {dish.code}
                    </span>
                    <Badge variant="secondary" className="text-xs">#{dish.sort_order}</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Close" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* Variants section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{t("dish.variants")}</h3>
                {!loading && variants.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                    {variants.length}
                  </span>
                )}
                {!loading && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-7 text-xs px-2.5 gap-1"
                    onClick={openCreateVariantDialog}
                  >
                    <Plus className="h-3 w-3" /> {t("dish.addVariant")}
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : variants.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 border-2 border-dashed rounded-xl text-muted-foreground">
                  <UtensilsCrossed className="h-7 w-7 opacity-30" />
                  <p className="text-sm">{t("dish.noVariants")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {variants.map((variant) => (
                    <DishVariantCard
                      key={variant.id}
                      variant={variant}
                      availableLocales={availableLocales}
                      unitsByTypeId={unitsByTypeId}
                      onView={() => openViewVariantDialog(variant)}
                      onDelete={() => setDeleteTarget(variant)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

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

      {/* Variant create / view dialog */}
      {dish && (
        <DishVariantDialog
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          mode={variantDialogMode}
          dishId={dish.id}
          variant={variantDialogTarget}
          availableLocales={availableLocales}
          unitsByTypeId={unitsByTypeId}
          onUnitTypeLoad={handleUnitTypeLoad}
          onSaved={async () => {
            await fetchDetail(dish.id);
            if (variantDialogMode === "view" && variantDialogTarget) {
              const res = await dishesService.getVariant(dish.id, variantDialogTarget.id).catch(() => null);
              if (res) setVariantDialogTarget(res.dish_variant);
            }
          }}
        />
      )}
    </>
  );
}

