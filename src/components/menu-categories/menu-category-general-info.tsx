import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { menuCategoriesService } from "@/services/menu-categories";
import { toast } from "sonner";
import type { MenuCategoryDialogMode, MenuCategoryFormState } from "./types";

export interface MenuCategoryGeneralInfoProps {
  mode: MenuCategoryDialogMode;
  form: MenuCategoryFormState;
  onFormChange: (patch: Partial<MenuCategoryFormState>) => void;
  categoryId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function MenuCategoryGeneralInfo({
  mode,
  form,
  onFormChange,
  categoryId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: MenuCategoryGeneralInfoProps) {
  const { t } = useTranslation();
  const [localSortOrder, setLocalSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocalSortOrder(form.sort_order);
    onEditingChange(true);
  }

  async function save() {
    if (categoryId == null) return;
    setSubmitting(true);
    try {
      await menuCategoriesService.update(categoryId, { sort_order: Number(localSortOrder) || 0 });
      toast.success(t("common.save"));
      onEditingChange(false);
      onFormChange({ sort_order: Number(localSortOrder) || 0 });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

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
            <Label htmlFor="mc-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="mc-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="STARTERS"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mc-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="mc-sort"
              type="number"
              value={editing ? localSortOrder : form.sort_order}
              onChange={(e) => {
                if (mode === "create") onFormChange({ sort_order: Number(e.target.value) });
                else setLocalSortOrder(Number(e.target.value));
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
