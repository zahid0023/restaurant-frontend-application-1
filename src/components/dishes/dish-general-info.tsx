"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dishesService } from "@/services/dishes";
import { toast } from "sonner";
import type { DishFormState } from "./types";

export interface DishGeneralInfoProps {
  mode: "create" | "view";
  dishId?: number;
  form: DishFormState;
  onFormChange: (patch: Partial<DishFormState>) => void;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function DishGeneralInfo({
  mode,
  dishId,
  form,
  onFormChange,
  onSaved,
  editing,
  onEditingChange,
  open,
}: DishGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({ sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocal({ sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (dishId == null) return;
    setSubmitting(true);
    try {
      const newSortOrder = Number(local.sort_order) || 0;
      await dishesService.update(dishId, { sort_order: newSortOrder });
      toast.success(t("common.saved"));
      onEditingChange(false);
      onFormChange({ sort_order: newSortOrder });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const sortValue = editing ? local.sort_order : form.sort_order;
  const isReadOnly = !editing && mode !== "create";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
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
          <div className="space-y-2">
            <Label htmlFor="dish-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="dish-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
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
              value={sortValue}
              onChange={(e) => {
                if (mode === "create") onFormChange({ sort_order: Number(e.target.value) });
                else setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }));
              }}
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
