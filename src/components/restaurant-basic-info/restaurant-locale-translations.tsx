import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, Languages, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { restaurantBasicInfoService } from "@/services/restaurant-basic-info";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { RestaurantFormState, RestaurantLocaleRow } from "./types";

type RowWithKey = RestaurantLocaleRow & { _rkey: string };

export interface RestaurantLocaleTranslationsProps {
  form: RestaurantFormState;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
}

export function RestaurantLocaleTranslations({
  form,
  availableLocales,
  onSaved,
  editing,
  onEditingChange,
}: RestaurantLocaleTranslationsProps) {
  const { t } = useTranslation();
  const [newLocaleRows, setNewLocaleRows] = useState<RowWithKey[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, RestaurantLocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const rKeyCounter = useRef(0);

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: RestaurantLocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<RestaurantLocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  const allLocaleRows: RowWithKey[] = [
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
    ...newLocaleRows,
  ];

  async function saveRow(key: string, row: RestaurantLocaleRow, isNew: boolean) {
    const data = rowEditData[key];
    if (!data) return;
    const n = allLocaleRows.findIndex((r) => r._rkey === key) + 1;
    if (!data.locale_id) { toast.error(t("restaurantInfo.errLocaleLang", { n })); return; }
    if (!data.name.trim()) { toast.error(t("restaurantInfo.errLocaleName", { n })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await restaurantBasicInfoService.addLocale({
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          sort_order: Number(data.sort_order) || 0,
          short_description: data.short_description.trim() || undefined,
          address: data.address.trim() || undefined,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await restaurantBasicInfoService.updateLocale(row.id!, {
          name: data.name.trim(),
          sort_order: Number(data.sort_order) || 0,
          short_description: data.short_description.trim() || undefined,
          address: data.address.trim() || undefined,
        });
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
      toast.success(t("common.saved"));
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  async function deleteRow(row: RestaurantLocaleRow) {
    if (!row.id) return;
    const key = `e_${row.id}`;
    setBusy(key, true);
    try {
      await restaurantBasicInfoService.removeLocale(row.id);
      toast.success(t("locale.removedToast"));
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
    const newRow: RowWithKey = {
      _rkey,
      locale_id: nextLocale?.id ?? "",
      name: "",
      short_description: "",
      address: "",
      sort_order: form.locales.length + newLocaleRows.length + 1,
      _new: true,
    };
    setNewLocaleRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("locale.translations")}
          </h3>
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(true)} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addNewLocaleRow}
              disabled={(form.locales.length + newLocaleRows.length) >= availableLocales.length}
              className="h-7 text-xs px-2.5"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
            </Button>
          </div>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {/* VIEW mode */}
        {!editing && (
          form.locales.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.restaurantInfo")}
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
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("common.name")}</Label>
                        <Input value={row.name} disabled className="h-9 text-sm" onChange={() => {}} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")}</Label>
                        <Input type="number" value={row.sort_order} disabled className="h-9 text-sm" onChange={() => {}} />
                      </div>
                      {row.short_description && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("restaurantInfo.shortDescription")}</Label>
                          <Textarea value={row.short_description} disabled rows={2} className="text-sm resize-none" onChange={() => {}} />
                        </div>
                      )}
                      {row.address && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("restaurantInfo.address")}</Label>
                          <Textarea value={row.address} disabled rows={2} className="text-sm resize-none" onChange={() => {}} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* EDIT mode */}
        {editing && (
          allLocaleRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.restaurantInfo")}
            </div>
          ) : (
            <div className="divide-y">
              {allLocaleRows.map((row) => {
                const key = row._rkey;
                const isNew = !!row._new;
                const rowEditing = isRowEditing(key);
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
                        {!rowEditing && localeMeta
                          ? `${localeMeta.name} (${localeMeta.code})`
                          : t("locale.row.label", { n: allLocaleRows.indexOf(row) + 1 })}
                        {isNew && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                            {t("locale.row.new")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!rowEditing && (
                          <>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => startEditRow(key, row)} disabled={busy}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {!isNew && (
                              <Button type="button" size="icon" variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteRow(row)} disabled={busy}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                        {rowEditing && (
                          <>
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => cancelEditRow(key, isNew)} disabled={busy}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-primary"
                              onClick={() => saveRow(key, row, isNew)} disabled={busy}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        <Select
                          value={editData.locale_id ? String(editData.locale_id) : ""}
                          onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}
                          disabled={!rowEditing || !isNew}
                        >
                          <SelectTrigger className="h-9 text-sm w-full">
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
                        <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => patchRowEdit(key, { name: e.target.value })}
                          disabled={!rowEditing}
                          className="h-9 text-sm"
                          placeholder="The Grand Restaurant"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                        <Input
                          type="number"
                          value={editData.sort_order}
                          onChange={(e) => patchRowEdit(key, { sort_order: Number(e.target.value) })}
                          disabled={!rowEditing}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("restaurantInfo.shortDescription")}</Label>
                        <Textarea
                          value={editData.short_description}
                          onChange={(e) => patchRowEdit(key, { short_description: e.target.value })}
                          disabled={!rowEditing}
                          rows={2}
                          className="text-sm resize-none"
                          placeholder="Fine dining in the heart of the city."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("restaurantInfo.address")}</Label>
                        <Textarea
                          value={editData.address}
                          onChange={(e) => patchRowEdit(key, { address: e.target.value })}
                          disabled={!rowEditing}
                          rows={2}
                          className="text-sm resize-none"
                          placeholder="123 Main Street, Istanbul"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </Card>
    </div>
  );
}
