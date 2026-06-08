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
import { unitsService } from "@/services/units";
import { toast } from "sonner";
import type { UnitDialogMode, UnitFormState } from "./types";

export interface UnitGeneralInfoProps {
  mode: UnitDialogMode;
  form: UnitFormState;
  onFormChange: (patch: Partial<UnitFormState>) => void;
  unitTypeId: number;
  unitId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function UnitGeneralInfo({
  mode,
  form,
  onFormChange,
  unitTypeId,
  unitId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: UnitGeneralInfoProps) {
  const { t } = useTranslation();
  const [localGeneral, setLocalGeneral] = useState({ is_base: false, sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocalGeneral({ is_base: form.is_base, sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (unitId == null) return;
    setSubmitting(true);
    try {
      await unitsService.update(unitTypeId, unitId, {
        is_base: localGeneral.is_base,
        sort_order: Number(localGeneral.sort_order) || 0,
      });
      toast.success(t("common.save"));
      onEditingChange(false);
      onFormChange({ is_base: localGeneral.is_base, sort_order: Number(localGeneral.sort_order) || 0 });
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-code" className="text-xs font-medium">{t("common.code")} *</Label>
              <Input
                id="u-code"
                value={form.code}
                onChange={(e) => onFormChange({ code: e.target.value })}
                placeholder="KG"
                required
                disabled={mode !== "create"}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-base" className="text-xs font-medium">{t("unit.isBase")}</Label>
              <Select
                value={editing ? String(localGeneral.is_base) : String(form.is_base)}
                onValueChange={(v) => {
                  if (mode === "create") onFormChange({ is_base: v === "true" });
                  else setLocalGeneral({ ...localGeneral, is_base: v === "true" });
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger id="u-base" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("unit.base")}</SelectItem>
                  <SelectItem value="false">{t("unit.notBase")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="u-sort"
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
