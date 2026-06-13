import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countriesService } from "@/services/countries";
import { toast } from "sonner";
import type { CountryDialogMode, CountryFormState } from "./types";

export interface CountryGeneralInfoProps {
  mode: CountryDialogMode;
  form: CountryFormState;
  onFormChange: (patch: Partial<CountryFormState>) => void;
  countryId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function CountryGeneralInfo({
  mode,
  form,
  onFormChange,
  countryId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: CountryGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({ iso3_code: "", phone_code: "", sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocal({ iso3_code: form.iso3_code, phone_code: form.phone_code, sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (countryId == null) return;
    setSubmitting(true);
    try {
      await countriesService.update(countryId, {
        iso3_code: local.iso3_code.trim() || undefined,
        phone_code: local.phone_code.trim() || undefined,
        sort_order: Number(local.sort_order) || 0,
      });
      toast.success(t("countries.updatedToast"));
      onEditingChange(false);
      onFormChange({
        iso3_code: local.iso3_code.trim(),
        phone_code: local.phone_code.trim(),
        sort_order: Number(local.sort_order) || 0,
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const iso3Value = editing ? local.iso3_code : form.iso3_code;
  const phoneValue = editing ? local.phone_code : form.phone_code;
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
            <Label htmlFor="code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input id="code" value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="BD" required disabled={mode !== "create"} className="font-mono"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="iso3" className="text-xs font-medium">{t("field.iso3")}</Label>
              <Input id="iso3" value={iso3Value}
                onChange={(e) => mode === "create" ? onFormChange({ iso3_code: e.target.value }) : setLocal((p) => ({ ...p, iso3_code: e.target.value }))}
                placeholder="BGD" disabled={isReadOnly} className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-medium">{t("field.phone")}</Label>
              <Input id="phone" value={phoneValue}
                onChange={(e) => mode === "create" ? onFormChange({ phone_code: e.target.value }) : setLocal((p) => ({ ...p, phone_code: e.target.value }))}
                placeholder="+880" disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input id="sort" type="number" value={sortValue}
                onChange={(e) => mode === "create" ? onFormChange({ sort_order: Number(e.target.value) }) : setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                required={mode === "create"} disabled={isReadOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
