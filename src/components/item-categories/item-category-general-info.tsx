import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
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
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory } from "@/services/item-categories";
import { toast } from "sonner";
import type { ItemCategoryDialogMode, ItemCategoryFormState } from "./types";

const NO_PARENT = "__none__";

export interface ItemCategoryGeneralInfoProps {
  mode: ItemCategoryDialogMode;
  form: ItemCategoryFormState;
  onFormChange: (patch: Partial<ItemCategoryFormState>) => void;
  itemTypeId: number;
  categoryId?: number;
  availableParents: ItemCategory[];
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function ItemCategoryGeneralInfo({
  mode,
  form,
  onFormChange,
  itemTypeId,
  categoryId,
  availableParents,
  onSaved,
  editing,
  onEditingChange,
  open,
}: ItemCategoryGeneralInfoProps) {
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
      await itemCategoriesService.update(itemTypeId, categoryId, { sort_order: Number(localSortOrder) || 0 });
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
  const parentCategory = availableParents.find((p) => p.id === form.parent_id);

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
            <Label htmlFor="cat-parent" className="text-xs font-medium">{t("itemCategory.parent")}</Label>
            {mode === "create" ? (
              <Select
                value={form.parent_id != null ? String(form.parent_id) : NO_PARENT}
                onValueChange={(v) => onFormChange({ parent_id: v === NO_PARENT ? null : Number(v) })}
              >
                <SelectTrigger id="cat-parent" className="w-full">
                  <SelectValue placeholder={t("itemCategory.noParent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>{t("itemCategory.noParent")}</SelectItem>
                  {availableParents.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={parentCategory ? parentCategory.code : t("itemCategory.noParent")}
                disabled
              />
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-code" className="text-xs font-medium">{t("common.code")} *</Label>
              <Input
                id="cat-code"
                value={form.code}
                onChange={(e) => onFormChange({ code: e.target.value })}
                placeholder="APPETIZER"
                required
                disabled={mode !== "create"}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="cat-sort"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
