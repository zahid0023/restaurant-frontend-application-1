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
import { diningSpaceTypesService } from "@/services/dining-space-types";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";

import type {
  DiningSpaceTypeDialogMode,
  DiningSpaceTypeFormState,
  DiningSpaceTypeLocaleRow,
} from "./types";

export const emptyDiningSpaceTypeForm: DiningSpaceTypeFormState = {
  code: "",
  sort_order: 0,
  locales: [],
};

export interface DiningSpaceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DiningSpaceTypeDialogMode;
  onModeChange?: (mode: DiningSpaceTypeDialogMode) => void;
  typeId?: number;
  form: DiningSpaceTypeFormState;
  onFormChange: (form: DiningSpaceTypeFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function DiningSpaceTypeDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  typeId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: DiningSpaceTypeDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const readOnly = mode === "view";

  const originalLocalesRef = useRef<Map<number, DiningSpaceTypeLocaleRow>>(new Map());
  useEffect(() => {
    if (open) {
      const map = new Map<number, DiningSpaceTypeLocaleRow>();
      for (const row of form.locales) {
        if (row.id != null) map.set(row.id, { ...row });
      }
      originalLocalesRef.current = map;
      setRemovedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, typeId]);

  function setForm(patch: Partial<DiningSpaceTypeFormState>) {
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

  function updateLocaleRow(idx: number, patch: Partial<DiningSpaceTypeLocaleRow>) {
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
    if (!form.code.trim()) {
      toast.error(t("diningSpaceType.errCode"));
      return;
    }

    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) {
        toast.error(t("diningSpaceType.errLocaleLang", { n: i + 1 }));
        return;
      }
      if (!row.name.trim()) {
        toast.error(t("diningSpaceType.errLocaleName", { n: i + 1 }));
        return;
      }
    }

    setSubmitting(true);
    try {
      const base = {
        code: form.code.trim().toUpperCase(),
        sort_order: Number(form.sort_order) || 0,
      };

      if (mode === "edit" && typeId != null) {
        await diningSpaceTypesService.update(typeId, base);

        for (const id of removedIds) {
          await diningSpaceTypesService.removeLocale(typeId, id);
        }

        const original = originalLocalesRef.current;
        const updatedRows = form.locales.filter((r) => {
          if (r.id == null || r._new) return false;
          const orig = original.get(r.id);
          if (!orig) return false;
          return (
            orig.locale_id !== r.locale_id ||
            orig.name !== r.name ||
            (orig.description ?? "") !== (r.description ?? "") ||
            Number(orig.sort_order) !== Number(r.sort_order)
          );
        });
        for (const row of updatedRows) {
          await diningSpaceTypesService.updateLocale(typeId, row.id!, {
            locale_id: Number(row.locale_id),
            name: row.name.trim(),
            description: row.description.trim() || undefined,
            sort_order: Number(row.sort_order) || 0,
          });
        }

        const newRows = form.locales.filter((r) => r._new);
        for (const row of newRows) {
          await diningSpaceTypesService.addLocale(typeId, {
            locale_id: Number(row.locale_id),
            name: row.name.trim(),
            description: row.description.trim() || undefined,
            sort_order: Number(row.sort_order) || 0,
          });
        }

        const parts: string[] = [];
        if (updatedRows.length) parts.push(`${updatedRows.length} updated`);
        if (newRows.length) parts.push(`${newRows.length} added`);
        if (removedIds.length) parts.push(`${removedIds.length} removed`);
        toast.success(
          parts.length
            ? `${t("diningSpaceType.updatedToast")} ${base.code} · locales: ${parts.join(", ")}`
            : `${t("diningSpaceType.updatedToast")} ${base.code}`,
        );
      } else {
        await diningSpaceTypesService.create({
          ...base,
          locales: form.locales.map((row) => ({
            locale_id: Number(row.locale_id),
            name: row.name.trim(),
            description: row.description.trim() || undefined,
            sort_order: Number(row.sort_order) || 0,
          })),
        });
        toast.success(`${t("diningSpaceType.createdToast")} ${base.code}`);
      }
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" && t("diningSpaceType.titleCreate")}
              {mode === "edit" && t("diningSpaceType.titleEdit")}
              {mode === "view" && t("diningSpaceType.titleView")}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" && t("diningSpaceType.descCreate")}
              {mode === "edit" && t("diningSpaceType.descEdit")}
              {mode === "view" && t("diningSpaceType.descView")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="code">{t("common.code")} *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ code: e.target.value })}
                placeholder="INDOOR"
                required
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">{t("field.sort")} *</Label>
              <Input
                id="sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ sort_order: Number(e.target.value) })}
                required
                disabled={readOnly}
              />
            </div>
          </div>

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
                  {mode === "view" && t("diningSpaceType.localeHelpView")}
                </p>
              </div>
              {(mode === "create" || mode === "edit") && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addLocaleRow}
                  disabled={form.locales.length >= availableLocales.length}
                >
                  <Plus className="h-4 w-4 mr-1" /> {t("locale.add")}
                </Button>
              )}
            </div>

            {form.locales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                {mode === "create" ? t("locale.empty.create") : t("diningSpaceType.noLocales")}
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
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLocaleRow(idx)}
                          >
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
                            <SelectTrigger>
                              <SelectValue placeholder={t("placeholder.selectLanguage")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLocales.map((l) => (
                                <SelectItem
                                  key={l.id}
                                  value={String(l.id)}
                                  disabled={usedIds.includes(l.id)}
                                >
                                  {l.name} ({l.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("field.sortShort")} *</Label>
                          <Input
                            type="number"
                            value={row.sort_order}
                            onChange={(e) =>
                              updateLocaleRow(idx, { sort_order: Number(e.target.value) })
                            }
                            disabled={fieldsReadOnly}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("common.name")} *</Label>
                        <Input
                          value={row.name}
                          onChange={(e) => updateLocaleRow(idx, { name: e.target.value })}
                          placeholder={t("diningSpaceType.namePlaceholder")}
                          disabled={fieldsReadOnly}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("common.description")}</Label>
                        <Textarea
                          value={row.description}
                          onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                          placeholder={t("diningSpaceType.descriptionPlaceholder")}
                          disabled={fieldsReadOnly}
                          rows={2}
                        />
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                {typeId != null && onModeChange && (
                  <Button type="button" onClick={() => onModeChange("edit")}>
                    <Pencil className="h-4 w-4 mr-1.5" /> {t("common.edit")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? t("common.saving")
                    : mode === "edit"
                    ? t("common.save")
                    : t("common.create")}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
