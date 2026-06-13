"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dishesService } from "@/services/dishes";
import { toast } from "sonner";

export interface DishGeneralInfoProps {
  mode: "create" | "view";
  dishId?: number;
  code: string;
  sortOrder: number;
  onCodeChange?: (v: string) => void;
  onSortOrderChange?: (v: number) => void;
  /** view mode — called with new sort_order after successful inline save */
  onUpdated?: (sortOrder: number) => void;
  onSaved?: () => void | Promise<void>;
}

export function DishGeneralInfo({
  mode,
  dishId,
  code,
  sortOrder,
  onCodeChange,
  onSortOrderChange,
  onUpdated,
  onSaved,
}: DishGeneralInfoProps) {
  const { t } = useTranslation();
  const [generalEditing, setGeneralEditing] = useState(false);
  const [localSortOrder, setLocalSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  function startEdit() {
    setLocalSortOrder(sortOrder);
    setGeneralEditing(true);
  }

  async function saveGeneral() {
    if (dishId == null) return;
    setSubmitting(true);
    try {
      const newSortOrder = Number(localSortOrder) || 0;
      await dishesService.update(dishId, { sort_order: newSortOrder });
      toast.success(t("common.save"));
      setGeneralEditing(false);
      onUpdated?.(newSortOrder);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const displaySortOrder = generalEditing ? localSortOrder : sortOrder;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>

        {mode !== "create" && !generalEditing && (
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
          <div className="space-y-2">
            <Label htmlFor="dish-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="dish-code"
              value={code}
              onChange={(e) => onCodeChange?.(e.target.value)}
              placeholder="BURGER_CLASSIC"
              required={mode === "create"}
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dish-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="dish-sort"
              type="number"
              value={displaySortOrder}
              onChange={(e) => {
                if (mode === "create") onSortOrderChange?.(Number(e.target.value));
                else setLocalSortOrder(Number(e.target.value));
              }}
              required={mode === "create"}
              disabled={!generalEditing && mode !== "create"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
