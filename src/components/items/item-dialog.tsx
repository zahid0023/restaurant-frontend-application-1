import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Languages, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { UnitTypeSummary } from "@/services/unit-types";
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
  itemId?: number;
  form: ItemFormState;
  onFormChange: (form: ItemFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

type NewLocaleRow = ItemLocaleRow & { _rkey: string };

export function ItemDialog({
  open,
  onOpenChange,
  mode,
  itemId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: ItemDialogProps) {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);

  // General Information section
  const [generalEditing, setGeneralEditing] = useState(false);
  const [localGeneral, setLocalGeneral] = useState<{
    unit_type_id: number | "";
    unit_id: number | "";
    sort_order: number;
  }>({ unit_type_id: "", unit_id: "", sort_order: 0 });
  const [submittingGeneral, setSubmittingGeneral] = useState(false);

  // Translations section
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, ItemLocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const rKeyCounter = useRef(0);

  // Unit types & units
  const [unitTypes, setUnitTypes] = useState<UnitTypeSummary[]>([]);
  const [loadingUnitTypes, setLoadingUnitTypes] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  function loadUnits(typeId: number | "") {
    if (!typeId) { setUnits([]); return; }
    setLoadingUnits(true);
    unitsService.list(Number(typeId), { size: 50, sort_by: "sortOrder" })
      .then((res) => setUnits(res.data))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setNewLocaleRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
      return;
    }
    setLoadingUnitTypes(true);
    unitTypesService.list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setUnitTypes(res.data))
      .catch(() => {})
      .finally(() => setLoadingUnitTypes(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    loadUnits(form.unit_type_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.unit_type_id, open]);

  function setForm(patch: Partial<ItemFormState>) {
    onFormChange({ ...form, ...patch });
  }

  function startEditGeneral() {
    setLocalGeneral({
      unit_type_id: form.unit_type_id,
      unit_id: form.unit_id,
      sort_order: form.sort_order,
    });
    setGeneralEditing(true);
  }

  async function saveGeneral() {
    if (itemId == null) return;
    if (!localGeneral.unit_id) { toast.error(t("item.errUnit")); return; }
    setSubmittingGeneral(true);
    try {
      await itemsService.update(itemId, {
        unit_id: Number(localGeneral.unit_id),
        sort_order: Number(localGeneral.sort_order) || 0,
      });
      toast.success(t("common.save"));
      setGeneralEditing(false);
      onFormChange({
        ...form,
        unit_type_id: localGeneral.unit_type_id,
        unit_id: localGeneral.unit_id,
        sort_order: Number(localGeneral.sort_order) || 0,
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmittingGeneral(false);
    }
  }

  function rowKey(row: ItemLocaleRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewLocaleRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: ItemLocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<ItemLocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: ItemLocaleRow, isNew: boolean) {
    if (itemId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (!data.locale_id) { toast.error(t("item.errLocaleLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("item.errLocaleName", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await itemsService.addLocale(itemId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await itemsService.updateLocale(itemId, row.id!, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
      toast.success(t("common.save"));
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  async function deleteRow(row: ItemLocaleRow) {
    if (itemId == null || !row.id) return;
    const key = rowKey(row);
    setBusy(key, true);
    try {
      await itemsService.removeLocale(itemId, row.id);
      toast.success("Locale removed");
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  function addNewLocaleRow() {
    const usedIds = new Set([
      ...form.locales.map((r) => r.locale_id),
      ...newLocaleRows.map((r) => r.locale_id),
    ].filter((v): v is number => typeof v === "number"));
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id));
    const _rkey = `n_${rKeyCounter.current++}`;
    const newRow: NewLocaleRow = {
      _rkey,
      locale_id: nextLocale?.id ?? "",
      name: "",
      description: "",
      sort_order: form.locales.length + newLocaleRows.length + 1,
      _new: true,
    };
    setNewLocaleRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }));
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
        { locale_id: nextLocale ? nextLocale.id : "", name: "", description: "", sort_order: form.locales.length + 1, _new: true },
      ],
    });
  }

  function updateLocaleRow(idx: number, patch: Partial<ItemLocaleRow>) {
    onFormChange({ ...form, locales: form.locales.map((row, i) => (i === idx ? { ...row, ...patch } : row)) });
  }

  function removeLocaleRow(idx: number) {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("item.errCode")); return; }
    if (!form.unit_id) { toast.error(t("item.errUnit")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("item.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("item.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await itemsService.create({
        code,
        unit_id: Number(form.unit_id),
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(t("item.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const allLocaleRows: Array<ItemLocaleRow & { _rkey: string }> = [
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
    ...newLocaleRows,
  ];

  const activeUnitTypeId = generalEditing ? localGeneral.unit_type_id : form.unit_type_id;
  const activeUnitId = generalEditing ? localGeneral.unit_id : form.unit_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

          {/* HEADER */}
          <DialogHeader className="shrink-0 px-6 py-5 border-b bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  {mode === "create" && t("item.titleCreate")}
                  {mode !== "create" && (generalEditing || translationsEditing ? t("item.titleEdit") : t("item.titleView"))}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {mode === "create" && t("item.descCreate")}
                  {mode !== "create" && (generalEditing || translationsEditing ? t("item.descEdit") : t("item.descView"))}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* General Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    General Information
                  </h3>
                </div>

                {mode !== "create" && !generalEditing && (
                  <Button type="button" size="sm" variant="outline"
                    onClick={startEditGeneral}
                    className="h-7 text-xs px-2.5 gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                  </Button>
                )}
                {generalEditing && (
                  <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => { setGeneralEditing(false); loadUnits(form.unit_type_id); }}
                      disabled={submittingGeneral}
                      className="h-7 text-xs px-2.5 gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                    </Button>
                    <Button type="button" size="sm" onClick={saveGeneral}
                      disabled={submittingGeneral} className="h-7 text-xs px-2.5 gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {submittingGeneral ? t("common.saving") : t("common.save")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item-code" className="text-xs font-medium">{t("common.code")} *</Label>
                  <Input
                    id="item-code"
                    value={form.code}
                    onChange={(e) => setForm({ code: e.target.value })}
                    placeholder="TOMATO"
                    required
                    disabled={mode !== "create"}
                    className="font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="item-unit-type" className="text-xs font-medium">{t("item.unitType")} *</Label>
                    <Select
                      value={activeUnitTypeId ? String(activeUnitTypeId) : ""}
                      onValueChange={(v) => {
                        if (mode === "create") setForm({ unit_type_id: Number(v), unit_id: "" });
                        else setLocalGeneral({ ...localGeneral, unit_type_id: Number(v), unit_id: "" });
                        loadUnits(Number(v));
                      }}
                      disabled={(!generalEditing && mode !== "create") || loadingUnitTypes}
                    >
                      <SelectTrigger id="item-unit-type">
                        <SelectValue placeholder={loadingUnitTypes ? t("item.loadingUnitTypes") : t("item.selectUnitType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map((ut) => (
                          <SelectItem key={ut.id} value={String(ut.id)}>{ut.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-unit" className="text-xs font-medium">{t("item.unit")} *</Label>
                    <Select
                      value={activeUnitId ? String(activeUnitId) : ""}
                      onValueChange={(v) => {
                        if (mode === "create") setForm({ unit_id: Number(v) });
                        else setLocalGeneral({ ...localGeneral, unit_id: Number(v) });
                      }}
                      disabled={(!generalEditing && mode !== "create") || loadingUnits || !activeUnitTypeId}
                    >
                      <SelectTrigger id="item-unit">
                        <SelectValue placeholder={
                          !activeUnitTypeId ? t("item.selectUnitTypeFirst")
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
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
                  <Input
                    id="item-sort"
                    type="number"
                    value={generalEditing ? localGeneral.sort_order : form.sort_order}
                    onChange={(e) => {
                      if (mode === "create") setForm({ sort_order: Number(e.target.value) });
                      else setLocalGeneral({ ...localGeneral, sort_order: Number(e.target.value) });
                    }}
                    required={mode === "create"}
                    disabled={!generalEditing && mode !== "create"}
                  />
                </div>
              </div>
            </div>

            {/* Locale Translations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    {t("locale.translations")}
                  </h3>
                </div>

                {mode !== "create" && !translationsEditing && (
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => setTranslationsEditing(true)}
                    className="h-7 text-xs px-2.5 gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                  </Button>
                )}
                {translationsEditing && (
                  <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => setTranslationsEditing(false)}
                      className="h-7 text-xs px-2.5 gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={addNewLocaleRow}
                      disabled={(form.locales.length + newLocaleRows.length) >= availableLocales.length}
                      className="h-7 text-xs px-2.5"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
                    </Button>
                  </div>
                )}
                {mode === "create" && (
                  <Button type="button" size="sm" variant="outline" onClick={addLocaleRow}
                    disabled={form.locales.length >= availableLocales.length}
                    className="h-7 text-xs px-2.5"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
                  </Button>
                )}
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">

                {/* VIEW mode */}
                {!translationsEditing && mode !== "create" && (
                  form.locales.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4 mr-2 opacity-40" />
                      {t("item.noLocales")}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {form.locales.map((row, idx) => {
                        const localeMeta = availableLocales.find((l) => l.id === row.locale_id);
                        return (
                          <div key={`e_${row.id}`} className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                              {localeMeta ? `${localeMeta.name} (${localeMeta.code})` : t("locale.row.label", { n: idx + 1 })}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs text-muted-foreground">{t("field.language")}</Label>
                                <Select value={row.locale_id ? String(row.locale_id) : ""} disabled>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder={t("placeholder.selectLanguage")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableLocales.map((l) => (
                                      <SelectItem key={l.id} value={String(l.id)}>{l.name} ({l.code})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">{t("field.sort")}</Label>
                                <Input type="number" value={row.sort_order} disabled className="h-9 text-sm" onChange={() => {}} />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.name")}</Label>
                              <Input value={row.name} disabled placeholder={t("item.namePlaceholder")} className="h-9 text-sm" onChange={() => {}} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea value={row.description ?? ""} disabled placeholder={t("item.descriptionPlaceholder")} rows={2} className="text-sm resize-none" onChange={() => {}} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* CREATE mode */}
                {mode === "create" && (
                  form.locales.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4 mr-2 opacity-40" />
                      {t("locale.empty.create")}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {form.locales.map((row, idx) => {
                        const usedIds = form.locales.map((r, i) => i !== idx ? r.locale_id : null).filter((v): v is number => typeof v === "number");
                        return (
                          <div key={idx} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                                {t("locale.row.label", { n: idx + 1 })}
                                <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{t("locale.row.new")}</span>
                              </div>
                              <Button type="button" size="icon" variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeLocaleRow(idx)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                                <Select
                                  value={row.locale_id ? String(row.locale_id) : ""}
                                  onValueChange={(v) => updateLocaleRow(idx, { locale_id: Number(v) })}
                                >
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder={t("placeholder.selectLanguage")} />
                                  </SelectTrigger>
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
                                <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                                <Input type="number" value={row.sort_order}
                                  onChange={(e) => updateLocaleRow(idx, { sort_order: Number(e.target.value) })}
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                              <Input value={row.name}
                                onChange={(e) => updateLocaleRow(idx, { name: e.target.value })}
                                placeholder={t("item.namePlaceholder")}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea value={row.description}
                                onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                                placeholder={t("item.descriptionPlaceholder")}
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* TRANSLATIONS EDITING mode */}
                {translationsEditing && (
                  allLocaleRows.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4 mr-2 opacity-40" />
                      {t("item.noLocales")}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {allLocaleRows.map((row) => {
                        const key = row._rkey;
                        const isNew = !!row._new;
                        const editing = isRowEditing(key);
                        const busy = isRowBusy(key);
                        const editData = rowEditData[key] ?? row;
                        const localeMeta = availableLocales.find((l) => l.id === row.locale_id);
                        const usedIds = allLocaleRows
                          .filter((r) => r._rkey !== key)
                          .map((r) => r.locale_id)
                          .filter((v): v is number => typeof v === "number");

                        return (
                          <div key={key} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                                {!editing && localeMeta
                                  ? `${localeMeta.name} (${localeMeta.code})`
                                  : t("locale.row.label", { n: allLocaleRows.indexOf(row) + 1 })}
                                {isNew && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                                    {t("locale.row.new")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!editing && (
                                  <>
                                    <Button type="button" size="icon" variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => startEditRow(key, row)}
                                      disabled={busy}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    {!isNew && (
                                      <Button type="button" size="icon" variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteRow(row)}
                                        disabled={busy}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                )}
                                {editing && (
                                  <>
                                    <Button type="button" size="icon" variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => cancelEditRow(key, isNew)}
                                      disabled={busy}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost"
                                      className="h-7 w-7 text-primary"
                                      onClick={() => saveRow(key, row, isNew)}
                                      disabled={busy}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                                <Select
                                  value={editData.locale_id ? String(editData.locale_id) : ""}
                                  onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}
                                  disabled={!editing || !isNew}
                                >
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder={t("placeholder.selectLanguage")} />
                                  </SelectTrigger>
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
                                <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                                <Input type="number"
                                  value={editData.sort_order}
                                  onChange={(e) => patchRowEdit(key, { sort_order: Number(e.target.value) })}
                                  disabled={!editing}
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                              <Input
                                value={editData.name}
                                onChange={(e) => patchRowEdit(key, { name: e.target.value })}
                                placeholder={t("item.namePlaceholder")}
                                disabled={!editing}
                                className="h-9 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea
                                value={editData.description ?? ""}
                                onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                                placeholder={t("item.descriptionPlaceholder")}
                                disabled={!editing}
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* FOOTER (create mode only) */}
          {mode === "create" && (
            <DialogFooter className="shrink-0 px-6 py-4 border-t bg-muted/40">
              <div className="flex items-center gap-2 w-full justify-end">
                <Button type="button" variant="outline" size="sm"
                  onClick={() => onOpenChange(false)} disabled={submitting} className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {submitting ? t("common.saving") : t("common.create")}
                </Button>
              </div>
            </DialogFooter>
          )}

        </form>
      </DialogContent>
    </Dialog>
  );
}
