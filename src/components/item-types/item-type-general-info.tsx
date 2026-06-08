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
import { itemTypesService } from "@/services/item-types";
import { toast } from "sonner";
import type { ItemTypeDialogMode, ItemTypeFormState } from "./types";

export interface ItemTypeGeneralInfoProps {
  mode: ItemTypeDialogMode;
  form: ItemTypeFormState;
  onFormChange: (patch: Partial<ItemTypeFormState>) => void;
  typeId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function ItemTypeGeneralInfo({
  mode,
  form,
  onFormChange,
  typeId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: ItemTypeGeneralInfoProps) {
  const { t } = useTranslation();
  const [localGeneral, setLocalGeneral] = useState({ is_consumable: true, sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocalGeneral({ is_consumable: form.is_consumable, sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (typeId == null) return;
    setSubmitting(true);
    try {
      await itemTypesService.update(typeId, {
        is_consumable: localGeneral.is_consumable,
        sort_order: Number(localGeneral.sort_order) || 0,
      });
      toast.success(t("common.save"));
      onEditingChange(false);
      onFormChange({ is_consumable: localGeneral.is_consumable, sort_order: Number(localGeneral.sort_order) || 0 });
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
            <Label htmlFor="it-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="it-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="INGREDIENT"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="it-consumable" className="text-xs font-medium">{t("itemType.isConsumable")}</Label>
              <Select
                value={editing ? String(localGeneral.is_consumable) : String(form.is_consumable)}
                onValueChange={(v) => {
                  if (mode === "create") onFormChange({ is_consumable: v === "true" });
                  else setLocalGeneral({ ...localGeneral, is_consumable: v === "true" });
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger id="it-consumable" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("itemType.consumable")}</SelectItem>
                  <SelectItem value="false">{t("itemType.nonConsumable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="it-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="it-sort"
                type="number"
                value={editing ? localGeneral.sort_order : form.sort_order}
                onChange={(e) => {
                  if (mode === "create") onFormChange({ sort_order: Number(e.target.value) });
                  else setLocalGeneral({ ...localGeneral, sort_order: Number(e.target.value) });
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
