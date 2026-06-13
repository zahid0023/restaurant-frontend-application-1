"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dishesService } from "@/services/dishes";
import { toast } from "sonner";

export interface DishVariantGeneralInfoProps {
  mode: "create" | "view";
  dishId: number;
  variantId?: number;
  code: string;
  sortOrder: number;
  price: number;
  isDefault: boolean;
  isVeg: boolean;
  /** create mode */
  onCodeChange?: (v: string) => void;
  onSortOrderChange?: (v: number) => void;
  onPriceChange?: (v: number) => void;
  onIsDefaultChange?: (v: boolean) => void;
  onIsVegChange?: (v: boolean) => void;
  /** view mode — called with new values after successful inline save */
  onUpdated?: (updates: { sort_order: number; price: number; is_default: boolean; is_veg: boolean }) => void;
  /** called after any successful API mutation */
  onSaved?: () => void | Promise<void>;
}

export function DishVariantGeneralInfo({
  mode,
  dishId,
  variantId,
  code,
  sortOrder,
  price,
  isDefault,
  isVeg,
  onCodeChange,
  onSortOrderChange,
  onPriceChange,
  onIsDefaultChange,
  onIsVegChange,
  onUpdated,
  onSaved,
}: DishVariantGeneralInfoProps) {
  const { t } = useTranslation();
  const [generalEditing, setGeneralEditing] = useState(false);
  const [localGeneral, setLocalGeneral] = useState({ sort_order: 0, price: 0, is_default: false, is_veg: false });
  const [submitting, setSubmitting] = useState(false);

  function startEdit() {
    setLocalGeneral({ sort_order: sortOrder, price, is_default: isDefault, is_veg: isVeg });
    setGeneralEditing(true);
  }

  async function saveGeneral() {
    if (variantId == null) return;
    setSubmitting(true);
    try {
      const updates = {
        sort_order: Number(localGeneral.sort_order) || 0,
        price: Number(localGeneral.price) || 0,
        is_default: localGeneral.is_default,
        is_veg: localGeneral.is_veg,
      };
      await dishesService.updateVariant(dishId, variantId, updates);
      toast.success(t("dish.variantUpdated"));
      setGeneralEditing(false);
      onUpdated?.(updates);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const display = {
    sort_order: generalEditing ? localGeneral.sort_order : sortOrder,
    price: generalEditing ? localGeneral.price : price,
    is_default: generalEditing ? localGeneral.is_default : isDefault,
    is_veg: generalEditing ? localGeneral.is_veg : isVeg,
  };

  const isCreate = mode === "create";
  const editable = isCreate || generalEditing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>

        {!isCreate && !generalEditing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {generalEditing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => setGeneralEditing(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={saveGeneral} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="variant-code" className="text-xs font-medium">{t("common.code")} *</Label>
          <Input
            id="variant-code"
            value={code}
            onChange={(e) => onCodeChange?.(e.target.value)}
            placeholder="SINGLE"
            required={isCreate}
            disabled={!isCreate}
            className="font-mono"
          />
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="variant-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
          <Input
            id="variant-sort"
            type="number"
            value={display.sort_order}
            onChange={(e) => {
              if (isCreate) onSortOrderChange?.(Number(e.target.value));
              else setLocalGeneral((prev) => ({ ...prev, sort_order: Number(e.target.value) }));
            }}
            disabled={!editable}
            className="h-10"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="variant-price" className="text-xs font-medium">{t("dish.variantPrice")} *</Label>
          <Input
            id="variant-price"
            type="number"
            step="0.01"
            value={display.price}
            onChange={(e) => {
              if (isCreate) onPriceChange?.(Number(e.target.value));
              else setLocalGeneral((prev) => ({ ...prev, price: Number(e.target.value) }));
            }}
            disabled={!editable}
            className="h-10"
          />
        </div>

        {/* Is Default */}
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="variant-default"
            checked={display.is_default}
            onCheckedChange={(checked) => {
              const val = checked === true;
              if (isCreate) onIsDefaultChange?.(val);
              else setLocalGeneral((prev) => ({ ...prev, is_default: val }));
            }}
            disabled={!editable}
          />
          <Label htmlFor="variant-default" className="text-sm font-medium cursor-pointer">
            {t("dish.variantIsDefault")}
          </Label>
        </div>

        {/* Is Veg */}
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="variant-veg"
            checked={display.is_veg}
            onCheckedChange={(checked) => {
              const val = checked === true;
              if (isCreate) onIsVegChange?.(val);
              else setLocalGeneral((prev) => ({ ...prev, is_veg: val }));
            }}
            disabled={!editable}
          />
          <Label htmlFor="variant-veg" className="text-sm font-medium cursor-pointer">
            {t("dish.veg")}
          </Label>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
