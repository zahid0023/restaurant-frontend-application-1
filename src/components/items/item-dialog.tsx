import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, X, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { itemsService } from "@/services/items";
import { unitTypesService } from "@/services/unit-types";
import type { UnitType } from "@/services/unit-types";
import { unitsService } from "@/services/units";
import type { Unit } from "@/services/units";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";

import type { ItemDialogMode, ItemFormState, ItemLocaleRow } from "./types";

export const emptyItemForm: ItemFormState = {
  code: "",
  unit_type_id: "",
  unit_id: "",
  sort_order: 0,
  locales: [],
};

export interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ItemDialogMode;
  onModeChange?: (mode: ItemDialogMode) => void;
  itemId?: number;
  form: ItemFormState;
  onFormChange: (form: ItemFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function ItemDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  itemId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: ItemDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const readOnly = mode === "view";

  // Unit type + unit state
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loadingUnitTypes, setLoadingUnitTypes] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Fetch unit types when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingUnitTypes(true);
    unitTypesService.list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setUnitTypes(res.data))
      .catch(() => {})
      .finally(() => setLoadingUnitTypes(false));
  }, [open]);

  // Fetch units when unit_type_id changes
  useEffect(() => {
    if (!form.unit_type_id) {
      setUnits([]);
      return;
    }
    setLoadingUnits(true);
    unitsService.list(Number(form.unit_type_id), { size: 50, sort_by: "sortOrder" })
      .then((res) => setUnits(res.data))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, [form.unit_type_id]);

  const originalLocalesRef = useRef<Map<number, ItemLocaleRow>>(new Map());
  useEffect(() => {
    if (open) {
      const map = new Map<number, ItemLocaleRow>();
      for (const row of form.locales) {
        if (row.id != null) map.set(row.id, { ...row });
      }
      originalLocalesRef.current = map;
      setRemovedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId]);

  function setForm(patch: Partial<ItemFormState>) {
    onFormChange({ ...form, ...patch });
  }

  function addLocaleRow() {
    const usedIds = new Set(
      form.locales.map((r) => r.locale_id).filter((v): v is number => typeof v === "number"),
    );
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id));
    onFormChange({
      ...form,
      locales: [
        ...form.locales,
        {
          locale_id: nextLocale ? nextLocale.id : "",
          name: "",
          description: "",
          sort_order: form.locales.length + 1,
          _new: true,
        },
      ],
    });
  }

  function updateLocaleRow(idx: number, patch: Partial<ItemLocaleRow>) {
    onFormChange({
      ...form,
      locales: form.locales.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    });
  }

  function removeLocaleRow(idx: number) {
    const row = form.locales[idx];
    if (row?.id != null && !row._new) {
      setRemovedIds((prev) => [...prev, row.id!]);
    }
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    if (!form.unit_id) {
      toast.error(t("item.errUnit"));
      return;
    }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("item.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("item.errLocaleName", { n: i + 1 })); return; }
    }

    setSubmitting(true);
    try {
      const base = {
        code: form.code.trim().toUpperCase() || undefined,
        unit_id: Number(form.unit_id),
        sort_order: Number(form.sort_order) || 0,
      };

      if (mode === "edit" && itemId != null) {
        await itemsService.update(itemId, base);

        for (const id of removedIds) await itemsService.removeLocale(itemId, id);

        const original = originalLocalesRef.current;
        const updatedRows = form.locales.filter((r) => {
          if (r.id == null || r._new) return false;
          const orig = original.get(r.id);
          if (!orig) return false;
          return orig.locale_id !== r.locale_id || orig.name !== r.name ||
            (orig.description ?? "") !== (r.description ?? "") ||
            Number(orig.sort_order) !== Number(r.sort_order);
        });
        for (const row of updatedRows) {
          await itemsService.updateLocale(itemId, row.id!, {
            locale_id: Number(row.locale_id), name: row.name.trim(),
            description: row.description.trim() || undefined, sort_order: Number(row.sort_order) || 0,
          });
        }
        const newRows = form.locales.filter((r) => r._new);
        for (const row of newRows) {
          await itemsService.addLocale(itemId, {
            locale_id: Number(row.locale_id), name: row.name.trim(),
            description: row.description.trim() || undefined, sort_order: Number(row.sort_order) || 0,
          });
        }

        const parts: string[] = [];
        if (updatedRows.length) parts.push(`${updatedRows.length} updated`);
        if (newRows.length) parts.push(`${newRows.length} added`);
        if (removedIds.length) parts.push(`${removedIds.length} removed`);
        toast.success(parts.length
          ? `${t("item.updatedToast")} · locales: ${parts.join(", ")}`
          : t("item.updatedToast"));
      } else {
        await itemsService.create({
          ...base,
          locales: form.locales.map((row) => ({
            locale_id: Number(row.locale_id), name: row.name.trim(),
            description: row.description.trim() || undefined, sort_order: Number(row.sort_order) || 0,
          })),
        });
        toast.success(t("item.createdToast"));
      }
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUnitType = unitTypes.find((ut) => ut.id === Number(form.unit_type_id));
  const selectedUnit = units.find((u) => u.id === Number(form.unit_id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" && t("item.titleCreate")}
              {mode === "edit" && t("item.titleEdit")}
              {mode === "view" && t("item.titleView")}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" && t("item.descCreate")}
              {mode === "edit" && t("item.descEdit")}
              {mode === "view" && t("item.descView")}
            </DialogDescription>
          </DialogHeader>

          {/* Unit type → unit selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("item.unitType")} *</Label>
              {readOnly ? (
                <Input value={selectedUnitType?.code ?? String(form.unit_type_id)} disabled />
              ) : (
                <Select
                  value={form.unit_type_id ? String(form.unit_type_id) : ""}
                  onValueChange={(v) => setForm({ unit_type_id: Number(v), unit_id: "" })}
                  disabled={loadingUnitTypes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUnitTypes ? t("item.loadingUnitTypes") : t("item.selectUnitType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((ut) => (
                      <SelectItem key={ut.id} value={String(ut.id)}>
                        {ut.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("item.unit")} *</Label>
              {readOnly ? (
                <Input value={selectedUnit?.code ?? String(form.unit_id)} disabled />
              ) : (
                <Select
                  value={form.unit_id ? String(form.unit_id) : ""}
                  onValueChange={(v) => setForm({ unit_id: Number(v) })}
                  disabled={!form.unit_type_id || loadingUnits}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !form.unit_type_id ? t("item.selectUnitTypeFirst")
                      : loadingUnits ? t("item.loadingUnits")
                      : t("item.selectUnit")
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.code}{u.is_base ? ` (${t("unit.base")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Code + sort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="code">{t("common.code")}</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ code: e.target.value })}
                placeholder="TOMATO" disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">{t("field.sort")} *</Label>
              <Input id="sort" type="number" value={form.sort_order}
                onChange={(e) => setForm({ sort_order: Number(e.target.value) })} required disabled={readOnly} />
            </div>
          </div>

          {/* Locales */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <Languages className="h-4 w-4" />
                  {t("locale.translations")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "create" && t("locale.help.create")}
                  {mode === "edit" && t("locale.help.edit")}
                  {mode === "view" && t("item.localeHelpView")}
                </p>
              </div>
              {(mode === "create" || mode === "edit") && (
                <Button type="button" size="sm" variant="outline" onClick={addLocaleRow}
                  disabled={form.locales.length >= availableLocales.length}>
                  <Plus className="h-4 w-4 mr-1" /> {t("locale.add")}
                </Button>
              )}
            </div>

            {form.locales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                {mode === "create" ? t("locale.empty.create") : t("item.noLocales")}
              </p>
            ) : (
              <div className="space-y-3">
                {form.locales.map((row, idx) => {
                  const usedIds = form.locales
                    .map((r, i) => (i !== idx ? r.locale_id : null))
                    .filter((v): v is number => typeof v === "number");
                  const localeMeta = availableLocales.find((l) => l.id === row.locale_id);
                  const isNewRow = !!row._new;
                  const fieldsReadOnly = mode === "view";
                  const languageReadOnly = mode === "view" || (mode === "edit" && !isNewRow);
                  const canRemove = mode === "create" || mode === "edit";
                  return (
                    <div key={idx} className="rounded-lg border p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {languageReadOnly && localeMeta
                            ? `${localeMeta.name} (${localeMeta.code})`
                            : t("locale.row.label", { n: idx + 1 })}
                          {isNewRow && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {t("locale.row.new")}
                            </span>
                          )}
                        </div>
                        {canRemove && (
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeLocaleRow(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">{t("field.language")} *</Label>
                          <Select
                            value={row.locale_id ? String(row.locale_id) : ""}
                            onValueChange={(v) => updateLocaleRow(idx, { locale_id: Number(v) })}
                            disabled={languageReadOnly}
                          >
                            <SelectTrigger><SelectValue placeholder={t("placeholder.selectLanguage")} /></SelectTrigger>
                            <SelectContent>
                              {availableLocales.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)} disabled={usedIds.includes(l.id)}>
                                  {l.name} ({l.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("field.sortShort")} *</Label>
                          <Input type="number" value={row.sort_order}
                            onChange={(e) => updateLocaleRow(idx, { sort_order: Number(e.target.value) })}
                            disabled={fieldsReadOnly} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("common.name")} *</Label>
                        <Input value={row.name} onChange={(e) => updateLocaleRow(idx, { name: e.target.value })}
                          placeholder={t("item.namePlaceholder")} disabled={fieldsReadOnly} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("common.description")}</Label>
                        <Textarea value={row.description} onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                          placeholder={t("item.descriptionPlaceholder")} disabled={fieldsReadOnly} rows={2} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-2">
            {readOnly ? (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
                {itemId != null && onModeChange && (
                  <Button type="button" onClick={() => onModeChange("edit")}>
                    <Pencil className="h-4 w-4 mr-1.5" /> {t("common.edit")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("common.saving") : mode === "edit" ? t("common.save") : t("common.create")}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
