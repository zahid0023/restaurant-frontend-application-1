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
import { diningSpacesService } from "@/services/dining-spaces";
import type { Floor } from "@/services/floors";
import type { DiningSpaceType } from "@/services/dining-space-types";
import { toast } from "sonner";
import type { DiningSpaceDialogMode, DiningSpaceFormState } from "./types";

const NO_FLOOR = "__none__";

export interface DiningSpaceGeneralInfoProps {
  mode: DiningSpaceDialogMode;
  form: DiningSpaceFormState;
  onFormChange: (patch: Partial<DiningSpaceFormState>) => void;
  spaceId?: number;
  availableFloors: Floor[];
  availableTypes: DiningSpaceType[];
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function DiningSpaceGeneralInfo({
  mode,
  form,
  onFormChange,
  spaceId,
  availableFloors,
  availableTypes,
  onSaved,
  editing,
  onEditingChange,
  open,
}: DiningSpaceGeneralInfoProps) {
  const { t } = useTranslation();
  const [localGeneral, setLocalGeneral] = useState({ sort_order: 0, capacity: 1, is_bookable: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocalGeneral({ sort_order: form.sort_order, capacity: form.capacity, is_bookable: form.is_bookable });
    onEditingChange(true);
  }

  async function save() {
    if (spaceId == null) return;
    setSubmitting(true);
    try {
      await diningSpacesService.update(spaceId, {
        sort_order: Number(localGeneral.sort_order) || 0,
        capacity: Number(localGeneral.capacity) || 1,
        is_bookable: localGeneral.is_bookable,
      });
      toast.success(t("diningSpace.updatedToast"));
      onEditingChange(false);
      onFormChange({
        sort_order: Number(localGeneral.sort_order) || 0,
        capacity: Number(localGeneral.capacity) || 1,
        is_bookable: localGeneral.is_bookable,
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = availableTypes.find((tp) => tp.id === Number(form.dining_space_type_id));
  const selectedFloor = availableFloors.find((f) => f.id === form.floor_id);

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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ds-type" className="text-xs font-medium">{t("diningSpace.type")} *</Label>
              {mode === "create" ? (
                <Select
                  value={form.dining_space_type_id ? String(form.dining_space_type_id) : ""}
                  onValueChange={(v) => onFormChange({ dining_space_type_id: Number(v) })}
                >
                  <SelectTrigger id="ds-type" className="w-full">
                    <SelectValue placeholder={t("diningSpace.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((tp) => (
                      <SelectItem key={tp.id} value={String(tp.id)}>
                        {tp.locales[0]?.name ?? tp.code} ({tp.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="ds-type"
                  value={selectedType ? (selectedType.locales[0]?.name ?? selectedType.code) : String(form.dining_space_type_id)}
                  disabled
                  className="font-mono"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-floor" className="text-xs font-medium">{t("diningSpace.floor")}</Label>
              {mode === "create" ? (
                <Select
                  value={form.floor_id != null ? String(form.floor_id) : NO_FLOOR}
                  onValueChange={(v) => onFormChange({ floor_id: v === NO_FLOOR ? null : Number(v) })}
                >
                  <SelectTrigger id="ds-floor" className="w-full">
                    <SelectValue placeholder={t("diningSpace.selectFloor")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_FLOOR}>{t("diningSpace.noFloor")}</SelectItem>
                    {availableFloors.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.locales[0]?.name ?? f.code} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="ds-floor"
                  value={form.floor_id != null ? (selectedFloor ? (selectedFloor.locales[0]?.name ?? selectedFloor.code) : String(form.floor_id)) : "—"}
                  disabled
                  className="font-mono"
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ds-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="ds-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="MAIN_HALL"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ds-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="ds-sort"
                type="number"
                value={editing ? localGeneral.sort_order : form.sort_order}
                onChange={(e) => {
                  if (mode === "create") onFormChange({ sort_order: Number(e.target.value) });
                  else setLocalGeneral((p) => ({ ...p, sort_order: Number(e.target.value) }));
                }}
                required={mode === "create"}
                disabled={!editing && mode !== "create"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-capacity" className="text-xs font-medium">{t("diningSpace.capacity")} *</Label>
              <Input
                id="ds-capacity"
                type="number"
                min={1}
                value={editing ? localGeneral.capacity : form.capacity}
                onChange={(e) => {
                  if (mode === "create") onFormChange({ capacity: Number(e.target.value) });
                  else setLocalGeneral((p) => ({ ...p, capacity: Number(e.target.value) }));
                }}
                required={mode === "create"}
                disabled={!editing && mode !== "create"}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("diningSpace.isBookable")}</Label>
              <label className={`flex items-center gap-2 h-9 ${!editing && mode !== "create" ? "opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={editing ? localGeneral.is_bookable : form.is_bookable}
                  onChange={(e) => {
                    if (mode === "create") onFormChange({ is_bookable: e.target.checked });
                    else setLocalGeneral((p) => ({ ...p, is_bookable: e.target.checked }));
                  }}
                  disabled={!editing && mode !== "create"}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">
                  {(editing ? localGeneral.is_bookable : form.is_bookable)
                    ? t("diningSpace.bookable")
                    : t("diningSpace.notBookable")}
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
