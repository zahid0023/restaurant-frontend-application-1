"use client";

import { Eye, Languages, Trash2 } from "lucide-react";
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
      className="group overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Card header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs">
            {variant.code.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{displayName}</p>
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

      {/* General info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-sm font-semibold tabular-nums">{Number(variant.price).toFixed(2)}</span>
          <Badge variant="secondary" className="text-xs">#{variant.sort_order}</Badge>
          {variant.is_default && <Badge variant="secondary" className="text-xs">{t("dish.variantDefault")}</Badge>}
          {variant.is_veg ? (
            <Badge variant="outline" className="text-xs text-green-600 border-green-600">{t("dish.veg")}</Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">{t("dish.notVeg")}</Badge>
          )}
        </div>
      </div>

      {/* Locale count */}
      <div className="px-4 pb-3 border-t pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Languages className="h-3 w-3" />
          <span>{localeCount} {localeCount === 1 ? t("dish.locale") : t("dish.locales")}</span>
          {localeCount > 0 && variant.locales?.[0] && (
            <>
              <span>·</span>
              <span className="truncate">{availableLocales.find((l) => l.id === variant.locales![0].locale_id)?.code ?? ""}: {variant.locales[0].name}</span>
            </>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="px-4 pb-3 border-t pt-3">
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
