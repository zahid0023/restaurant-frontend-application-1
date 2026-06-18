"use client";

import { Eye, Languages, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { DishVariant } from "@/services/dishes";
import type { Locale } from "@/services/locales";
import type { Unit } from "@/services/units";

export interface DishVariantCardProps {
  variant: DishVariant;
  availableLocales: Locale[];
  unitsByTypeId: Record<number, Unit[]>;
  onView: () => void;
  onDelete: () => void;
}

export function DishVariantCard({ variant, availableLocales, unitsByTypeId, onView, onDelete }: DishVariantCardProps) {
  const { t } = useTranslation();
  const displayName = variant.locales?.[0]?.name?.trim() || variant.code;
  const localeCount = variant.locales?.length ?? 0;
  const ingredients = variant.ingredients ?? [];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView(); } }}
      className="group overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Veg / non-veg accent stripe */}
      <div className={`h-1 w-full shrink-0 ${variant.is_veg ? "bg-green-500" : "bg-red-400"}`} />

      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shrink-0 text-xs ${variant.is_default ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
            {variant.is_default ? <Star className="h-4 w-4 fill-current" /> : variant.code.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              {variant.is_default && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                  {t("dish.variantDefault")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{variant.code}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onView} title={t("common.view")}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Price + veg pill */}
      <div className="mx-4 mb-3 rounded-xl bg-muted/60 px-3 py-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">{t("dish.variantPrice")}</p>
          <p className="text-2xl font-extrabold tabular-nums leading-none tracking-tight">{Number(variant.price).toFixed(2)}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
          variant.is_veg
            ? "bg-green-500/10 text-green-600 border border-green-500/30"
            : "bg-red-500/10 text-red-500 border border-red-500/30"
        }`}>
          <div className={`h-2 w-2 rounded-full shrink-0 ${variant.is_veg ? "bg-green-500" : "bg-red-500"}`} />
          {variant.is_veg ? t("dish.veg") : t("dish.notVeg")}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 border-t pt-3 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <Languages className="h-3 w-3 shrink-0" />
          <span className="shrink-0">{localeCount} {localeCount === 1 ? t("dish.locale") : t("dish.locales")}</span>
          {localeCount > 0 && variant.locales?.[0] && (
            <>
              <span>·</span>
              <span className="truncate">{availableLocales.find((l) => l.id === variant.locales![0].locale_id)?.code ?? ""}: {variant.locales[0].name}</span>
            </>
          )}
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">#{variant.sort_order}</Badge>
      </div>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="px-4 pb-3 border-t pt-2.5">
          <div className="flex flex-wrap gap-1">
            {ingredients.slice(0, 4).map((ing) => {
              let unitCode = "";
              for (const units of Object.values(unitsByTypeId)) {
                const u = units.find((u) => u.id === ing.unit_id);
                if (u) { unitCode = u.code; break; }
              }
              return (
                <Badge key={ing.id} variant="outline" className="text-xs font-normal">
                  #{ing.item_id} × {ing.quantity}{unitCode ? ` ${unitCode}` : ""}
                </Badge>
              );
            })}
            {ingredients.length > 4 && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                +{ingredients.length - 4}
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
