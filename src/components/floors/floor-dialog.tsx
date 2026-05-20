import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Languages, LayoutTemplate, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { floorsService } from "@/services/floors";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { FloorDialogMode, FloorFormState, FloorLocaleRow } from "./types";

export const emptyFloorForm: FloorFormState = {
  code: "",
  sort_order: 0,
  locales: [],
};

export interface FloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FloorDialogMode;
  floorId?: number;
  form: FloorFormState;
  onFormChange: (form: FloorFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

type NewLocaleRow = FloorLocaleRow & { _rkey: string };

export function FloorDialog({
  open,
  onOpenChange,
  mode,
  floorId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: FloorDialogProps) {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);

  // General Information section
  const [generalEditing, setGeneralEditing] = useState(false);
  const [localSortOrder, setLocalSortOrder] = useState(0);
  const [submittingGeneral, setSubmittingGeneral] = useState(false);

  // Translations section
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, FloorLocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const rKeyCounter = useRef(0);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setNewLocaleRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
    }
  }, [open]);

  function setForm(patch: Partial<FloorFormState>) {
    onFormChange({ ...form, ...patch });
  }

  function startEditGeneral() {
    setLocalSortOrder(form.sort_order);
    setGeneralEditing(true);
  }

  async function saveGeneral() {
    if (floorId == null) return;
    setSubmittingGeneral(true);
    try {
      await floorsService.update(floorId, { sort_order: Number(localSortOrder) || 0 });
      toast.success(t("floor.updatedToast"));
      setGeneralEditing(false);
      onFormChange({ ...form, sort_order: Number(localSortOrder) || 0 });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmittingGeneral(false);
    }
  }

  function rowKey(row: FloorLocaleRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewLocaleRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: FloorLocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<FloorLocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: FloorLocaleRow, isNew: boolean) {
    if (floorId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (!data.locale_id) { toast.error(t("floor.errLocaleLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("floor.errLocaleName", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await floorsService.addLocale(floorId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await floorsService.updateLocale(floorId, row.id!, {
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

  async function deleteRow(row: FloorLocaleRow) {
    if (floorId == null || !row.id) return;
    const key = rowKey(row);
    setBusy(key, true);
    try {
      await floorsService.removeLocale(floorId, row.id);
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

  function updateLocaleRow(idx: number, patch: Partial<FloorLocaleRow>) {
    onFormChange({ ...form, locales: form.locales.map((row, i) => (i === idx ? { ...row, ...patch } : row)) });
  }

  function removeLocaleRow(idx: number) {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("floor.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("floor.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("floor.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await floorsService.create({
        code,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(`${t("floor.createdToast")} ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const allLocaleRows: Array<FloorLocaleRow & { _rkey: string }> = [
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
    ...newLocaleRows,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

          {/* HEADER */}
          <DialogHeader className="shrink-0 px-6 py-5 border-b bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <LayoutTemplate className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  {mode === "create" && t("floor.titleCreate")}
                  {mode !== "create" && (generalEditing || translationsEditing ? t("floor.titleEdit") : t("floor.titleView"))}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {mode === "create" && t("floor.descCreate")}
                  {mode !== "create" && (generalEditing || translationsEditing ? t("floor.descEdit") : t("floor.descView"))}
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
                      onClick={() => setGeneralEditing(false)}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="floor-code" className="text-xs font-medium">{t("common.code")} *</Label>
                    <Input
                      id="floor-code"
                      value={form.code}
                      onChange={(e) => setForm({ code: e.target.value })}
                      placeholder="GF"
                      required
                      disabled={mode !== "create"}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
                    <Input
                      id="floor-sort"
                      type="number"
                      value={generalEditing ? localSortOrder : form.sort_order}
                      onChange={(e) => setLocalSortOrder(Number(e.target.value))}
                      required={mode === "create"}
                      disabled={!generalEditing && mode !== "create"}
                    />
                  </div>
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
                      {t("floor.noLocales")}
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
                              <Input value={row.name} disabled placeholder={t("floor.namePlaceholder")} className="h-9 text-sm" onChange={() => {}} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea value={row.description} disabled placeholder={t("floor.descriptionPlaceholder")} rows={2} className="text-sm resize-none" onChange={() => {}} />
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
                                placeholder={t("floor.namePlaceholder")}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea value={row.description}
                                onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                                placeholder={t("floor.descriptionPlaceholder")}
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
                      {t("floor.noLocales")}
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
                                placeholder={t("floor.namePlaceholder")}
                                disabled={!editing}
                                className="h-9 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea
                                value={editData.description}
                                onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                                placeholder={t("floor.descriptionPlaceholder")}
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
