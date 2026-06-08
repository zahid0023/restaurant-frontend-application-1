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
import { itemsService } from "@/services/items";
import { itemTypesService } from "@/services/item-types";
import type { ItemType } from "@/services/item-types";
import { unitTypesService } from "@/services/unit-types";
import type { UnitTypeSummary } from "@/services/unit-types";
import { toast } from "sonner";
import type { ItemDialogMode, ItemFormState } from "./types";

export interface ItemGeneralInfoProps {
  mode: ItemDialogMode;
  form: ItemFormState;
  onFormChange: (patch: Partial<ItemFormState>) => void;
  itemId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function ItemGeneralInfo({
  mode,
  form,
  onFormChange,
  itemId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: ItemGeneralInfoProps) {
  const { t } = useTranslation();
  const [localSortOrder, setLocalSortOrder] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [loadingItemTypes, setLoadingItemTypes] = useState(false);
  const [unitTypes, setUnitTypes] = useState<UnitTypeSummary[]>([]);
  const [loadingUnitTypes, setLoadingUnitTypes] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      return;
    }
    if (mode === "create") {
      setLoadingItemTypes(true);
      itemTypesService.list({ size: 50, sort_by: "sortOrder" })
        .then((res) => setItemTypes(res.data))
        .catch(() => {})
        .finally(() => setLoadingItemTypes(false));

      setLoadingUnitTypes(true);
      unitTypesService.list({ size: 50, sort_by: "sortOrder" })
        .then((res) => setUnitTypes(res.data))
        .catch(() => {})
        .finally(() => setLoadingUnitTypes(false));
    }
  }, [open, mode]);

  function startEdit() {
    setLocalSortOrder(form.sort_order);
    onEditingChange(true);
  }

  async function save() {
    if (itemId == null) return;
    setSubmitting(true);
    try {
      await itemsService.update(itemId, {
        sort_order: Number(localSortOrder) || 0,
      });
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
            <Button
              type="button" size="sm" variant="outline"
              onClick={() => onEditingChange(false)}
              disabled={submitting}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
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
            <Label htmlFor="item-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="item-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="TOMATO"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          {mode === "create" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="item-item-type" className="text-xs font-medium">{t("item.itemType")} *</Label>
                <Select
                  value={form.item_type_id ? String(form.item_type_id) : ""}
                  onValueChange={(v) => onFormChange({ item_type_id: Number(v) })}
                  disabled={loadingItemTypes}
                >
                  <SelectTrigger id="item-item-type" className="w-full">
                    <SelectValue placeholder={loadingItemTypes ? t("item.loadingItemTypes") : t("item.selectItemType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((it) => (
                      <SelectItem key={it.id} value={String(it.id)}>{it.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit-type" className="text-xs font-medium">{t("item.unitType")} *</Label>
                <Select
                  value={form.unit_type_id ? String(form.unit_type_id) : ""}
                  onValueChange={(v) => onFormChange({ unit_type_id: Number(v) })}
                  disabled={loadingUnitTypes}
                >
                  <SelectTrigger id="item-unit-type" className="w-full">
                    <SelectValue placeholder={loadingUnitTypes ? t("item.loadingUnitTypes") : t("item.selectUnitType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((ut) => (
                      <SelectItem key={ut.id} value={String(ut.id)}>{ut.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="item-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="item-sort"
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
