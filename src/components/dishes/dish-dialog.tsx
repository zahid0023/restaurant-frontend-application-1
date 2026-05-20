import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChefHat, Languages, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { dishesService } from "@/services/dishes";
import { itemsService, type ItemSummary } from "@/services/items";
import { unitsService, type Unit } from "@/services/units";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { DishDialogMode, DishFormState, DishLocaleRow, DishVariantRow, IngredientRow } from "./types";

export const emptyDishForm: DishFormState = {
  code: "",
  sort_order: 0,
  is_veg: false,
  locales: [],
  variants: [],
};

export interface DishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DishDialogMode;
  menuId: number;
  menuCategoryId: number;
  dishId?: number;
  form: DishFormState;
  onFormChange: (form: DishFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

type NewLocaleRow = DishLocaleRow & { _rkey: string };

export function DishDialog({
  open,
  onOpenChange,
  mode,
  menuId,
  menuCategoryId,
  dishId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: DishDialogProps) {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);

  // Items & units for ingredient selection (create mode)
  const [availableItems, setAvailableItems] = useState<ItemSummary[]>([]);
  const [unitsByTypeId, setUnitsByTypeId] = useState<Record<number, Unit[]>>({});

  // General Information section
  const [generalEditing, setGeneralEditing] = useState(false);
  const [localGeneral, setLocalGeneral] = useState({ sort_order: 0, is_veg: false });
  const [submittingGeneral, setSubmittingGeneral] = useState(false);

  // Translations section
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, DishLocaleRow>>({});
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

  useEffect(() => {
    itemsService.list({ size: 50 }).then((res) => setAvailableItems(res.data)).catch(() => {});
  }, []);

  function setForm(patch: Partial<DishFormState>) {
    onFormChange({ ...form, ...patch });
  }

  function startEditGeneral() {
    setLocalGeneral({ sort_order: form.sort_order, is_veg: form.is_veg });
    setGeneralEditing(true);
  }

  async function saveGeneral() {
    if (dishId == null) return;
    setSubmittingGeneral(true);
    try {
      await dishesService.update(menuCategoryId, dishId, {
        sort_order: Number(localGeneral.sort_order) || 0,
        is_veg: localGeneral.is_veg,
      });
      toast.success(t("common.save"));
      setGeneralEditing(false);
      onFormChange({ ...form, sort_order: Number(localGeneral.sort_order) || 0, is_veg: localGeneral.is_veg });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmittingGeneral(false);
    }
  }

  function rowKey(row: DishLocaleRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewLocaleRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: DishLocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<DishLocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: DishLocaleRow, isNew: boolean) {
    if (dishId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (!data.locale_id) { toast.error(t("dish.errLocaleLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("dish.errLocaleName", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await dishesService.addLocale(menuId, menuCategoryId, dishId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await dishesService.updateLocale(menuId, menuCategoryId, dishId, row.id!, {
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

  async function deleteRow(row: DishLocaleRow) {
    if (dishId == null || !row.id) return;
    const key = rowKey(row);
    setBusy(key, true);
    try {
      await dishesService.removeLocale(menuId, menuCategoryId, dishId, row.id);
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

  function updateLocaleRow(idx: number, patch: Partial<DishLocaleRow>) {
    onFormChange({ ...form, locales: form.locales.map((row, i) => (i === idx ? { ...row, ...patch } : row)) });
  }

  function removeLocaleRow(idx: number) {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  }

  // ─── Variants ────────────────────────────────────────────────────────────

  function addVariant() {
    onFormChange({
      ...form,
      variants: [
        ...form.variants,
        {
          code: "",
          sort_order: form.variants.length + 1,
          price: 0,
          is_default: form.variants.length === 0,
          is_available: true,
          is_featured: false,
          locales: [],
          recipe: { code: "", ingredients: [] },
        },
      ],
    });
  }

  function removeVariant(vIdx: number) {
    onFormChange({ ...form, variants: form.variants.filter((_, i) => i !== vIdx) });
  }

  function patchVariant(vIdx: number, patch: Partial<DishVariantRow>) {
    onFormChange({
      ...form,
      variants: form.variants.map((v, i) => (i === vIdx ? { ...v, ...patch } : v)),
    });
  }

  function addVariantLocaleRow(vIdx: number) {
    const variant = form.variants[vIdx];
    const usedIds = new Set(variant.locales.map((r) => r.locale_id).filter((v): v is number => typeof v === "number"));
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id));
    patchVariant(vIdx, {
      locales: [
        ...variant.locales,
        { locale_id: nextLocale ? nextLocale.id : "", name: "", description: "", sort_order: variant.locales.length + 1, _new: true },
      ],
    });
  }

  function updateVariantLocaleRow(vIdx: number, lIdx: number, patch: Partial<DishLocaleRow>) {
    const variant = form.variants[vIdx];
    patchVariant(vIdx, { locales: variant.locales.map((r, i) => (i === lIdx ? { ...r, ...patch } : r)) });
  }

  function removeVariantLocaleRow(vIdx: number, lIdx: number) {
    const variant = form.variants[vIdx];
    patchVariant(vIdx, { locales: variant.locales.filter((_, i) => i !== lIdx) });
  }

  function addIngredientRow(vIdx: number) {
    const variant = form.variants[vIdx];
    patchVariant(vIdx, {
      recipe: {
        ...variant.recipe,
        ingredients: [...variant.recipe.ingredients, { item_id: "", quantity: 1, unit_id: "" }],
      },
    });
  }

  function updateIngredientRow(vIdx: number, iIdx: number, patch: Partial<IngredientRow>) {
    const variant = form.variants[vIdx];
    patchVariant(vIdx, {
      recipe: {
        ...variant.recipe,
        ingredients: variant.recipe.ingredients.map((ing, i) => (i === iIdx ? { ...ing, ...patch } : ing)),
      },
    });
  }

  function removeIngredientRow(vIdx: number, iIdx: number) {
    const variant = form.variants[vIdx];
    patchVariant(vIdx, {
      recipe: { ...variant.recipe, ingredients: variant.recipe.ingredients.filter((_, i) => i !== iIdx) },
    });
  }

  async function handleItemChange(vIdx: number, iIdx: number, itemIdStr: string) {
    const itemId = Number(itemIdStr);
    const item = availableItems.find((it) => it.id === itemId);
    if (!item) return;
    updateIngredientRow(vIdx, iIdx, { item_id: itemId, unit_id: item.unit.id });
    const unitTypeId = item.unit.unit_type.id;
    if (!unitsByTypeId[unitTypeId]) {
      try {
        const res = await unitsService.list(unitTypeId, { size: 50 });
        setUnitsByTypeId((prev) => ({ ...prev, [unitTypeId]: res.data }));
      } catch {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("dish.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("dish.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("dish.errLocaleName", { n: i + 1 })); return; }
    }
    for (const [vi, variant] of form.variants.entries()) {
      if (!variant.code.trim()) { toast.error(t("dish.errVariantCode", { n: vi + 1 })); return; }
      if (!variant.recipe.code.trim()) { toast.error(t("dish.errVariantRecipeCode", { n: vi + 1 })); return; }
      if (variant.recipe.ingredients.length === 0) { toast.error(t("dish.errVariantIngredients", { n: vi + 1 })); return; }
      for (const [ii, ing] of variant.recipe.ingredients.entries()) {
        if (!ing.item_id) { toast.error(t("dish.errIngredientItem", { n: vi + 1, m: ii + 1 })); return; }
        if (!ing.unit_id) { toast.error(t("dish.errIngredientUnit", { n: vi + 1, m: ii + 1 })); return; }
        if (!ing.quantity || ing.quantity <= 0) { toast.error(t("dish.errIngredientQty", { n: vi + 1, m: ii + 1 })); return; }
      }
      for (const [li, lRow] of variant.locales.entries()) {
        if (!lRow.locale_id) { toast.error(t("dish.errLocaleLang", { n: li + 1 })); return; }
        if (!lRow.name.trim()) { toast.error(t("dish.errLocaleName", { n: li + 1 })); return; }
      }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await dishesService.create(menuCategoryId, {
        code,
        sort_order: Number(form.sort_order) || 0,
        is_veg: form.is_veg,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
        variants: form.variants.map((v) => ({
          code: v.code.trim().toUpperCase(),
          sort_order: Number(v.sort_order) || 0,
          price: Number(v.price) || 0,
          is_default: v.is_default,
          is_available: v.is_available,
          is_featured: v.is_featured,
          locales: v.locales.map((l) => ({
            locale_id: Number(l.locale_id),
            name: l.name.trim(),
            description: l.description?.trim() || undefined,
            sort_order: Number(l.sort_order) || 0,
          })),
          recipe: {
            code: v.recipe.code.trim().toUpperCase(),
            ingredients: v.recipe.ingredients.map((ing) => ({
              item_id: Number(ing.item_id),
              quantity: Number(ing.quantity),
              unit_id: Number(ing.unit_id),
            })),
          },
        })),
      });
      toast.success(`${t("dish.createdToast")}: ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const allLocaleRows: Array<DishLocaleRow & { _rkey: string }> = [
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
    ...newLocaleRows,
  ];

  const isVegValue = (val: boolean) => val ? "true" : "false";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

          {/* HEADER */}
          <DialogHeader className="shrink-0 px-6 py-5 border-b bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  {mode === "create" && t("dish.titleCreate")}
                  {mode !== "create" && (generalEditing || translationsEditing ? t("dish.titleEdit") : t("dish.titleView"))}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {mode === "create" && t("dish.descCreate")}
                  {mode !== "create" && (generalEditing || translationsEditing ? t("dish.descEdit") : t("dish.descView"))}
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
                <div className="space-y-2">
                  <Label htmlFor="dish-code" className="text-xs font-medium">{t("common.code")} *</Label>
                  <Input
                    id="dish-code"
                    value={form.code}
                    onChange={(e) => setForm({ code: e.target.value })}
                    placeholder="BURGER_CLASSIC"
                    required
                    disabled={mode !== "create"}
                    className="font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dish-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
                    <Input
                      id="dish-sort"
                      type="number"
                      value={generalEditing ? localGeneral.sort_order : form.sort_order}
                      onChange={(e) => {
                        if (mode === "create") setForm({ sort_order: Number(e.target.value) });
                        else setLocalGeneral((prev) => ({ ...prev, sort_order: Number(e.target.value) }));
                      }}
                      required={mode === "create"}
                      disabled={!generalEditing && mode !== "create"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dish-veg" className="text-xs font-medium">{t("dish.isVeg")}</Label>
                    <Select
                      value={isVegValue(generalEditing ? localGeneral.is_veg : form.is_veg)}
                      onValueChange={(v) => {
                        const val = v === "true";
                        if (mode === "create") setForm({ is_veg: val });
                        else setLocalGeneral((prev) => ({ ...prev, is_veg: val }));
                      }}
                      disabled={!generalEditing && mode !== "create"}
                    >
                      <SelectTrigger id="dish-veg" className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">{t("dish.veg")}</SelectItem>
                        <SelectItem value="false">{t("dish.notVeg")}</SelectItem>
                      </SelectContent>
                    </Select>
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
                      {t("dish.noLocales")}
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
                              <Input value={row.name} disabled placeholder={t("dish.namePlaceholder")} className="h-9 text-sm" onChange={() => {}} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea value={row.description ?? ""} disabled placeholder={t("dish.descriptionPlaceholder")} rows={2} className="text-sm resize-none" onChange={() => {}} />
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
                                placeholder={t("dish.namePlaceholder")}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea value={row.description}
                                onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                                placeholder={t("dish.descriptionPlaceholder")}
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
                      {t("dish.noLocales")}
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
                                placeholder={t("dish.namePlaceholder")}
                                disabled={!editing}
                                className="h-9 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                              <Textarea
                                value={editData.description ?? ""}
                                onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                                placeholder={t("dish.descriptionPlaceholder")}
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

          {/* Variants (create mode only) */}
          {mode === "create" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    {t("dish.variants")}
                  </h3>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addVariant}
                  className="h-7 text-xs px-2.5"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("dish.addVariant")}
                </Button>
              </div>

              {form.variants.length === 0 ? (
                <div className="rounded-xl border bg-card flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <ChefHat className="h-4 w-4 mr-2 opacity-40" />
                  {t("dish.noVariants")}
                </div>
              ) : (
                <div className="space-y-4">
                  {form.variants.map((variant, vIdx) => (
                    <div key={vIdx} className="rounded-xl border bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ChefHat className="h-3.5 w-3.5 text-muted-foreground" />
                          {t("dish.variantRow", { n: vIdx + 1 })}
                          {variant.is_default && (
                            <Badge variant="secondary" className="text-xs">{t("dish.variantDefault")}</Badge>
                          )}
                        </div>
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeVariant(vIdx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Code / Sort / Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">{t("common.code")} *</Label>
                            <Input value={variant.code}
                              onChange={(e) => patchVariant(vIdx, { code: e.target.value })}
                              placeholder="SINGLE"
                              className="h-9 text-sm font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">{t("field.sort")} *</Label>
                            <Input type="number" value={variant.sort_order}
                              onChange={(e) => patchVariant(vIdx, { sort_order: Number(e.target.value) })}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">{t("dish.variantPrice")} *</Label>
                            <Input type="number" step="0.01" value={variant.price}
                              onChange={(e) => patchVariant(vIdx, { price: Number(e.target.value) })}
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        {/* Default / Available / Featured */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">{t("dish.variantIsDefault")}</Label>
                            <Select value={String(variant.is_default)}
                              onValueChange={(v) => patchVariant(vIdx, { is_default: v === "true" })}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">{t("dish.variantDefault")}</SelectItem>
                                <SelectItem value="false">{t("dish.variantNotDefault")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">{t("dish.variantIsAvailable")}</Label>
                            <Select value={String(variant.is_available)}
                              onValueChange={(v) => patchVariant(vIdx, { is_available: v === "true" })}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">{t("dish.variantAvailable")}</SelectItem>
                                <SelectItem value="false">{t("dish.variantNotAvailable")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">{t("dish.variantIsFeatured")}</Label>
                            <Select value={String(variant.is_featured)}
                              onValueChange={(v) => patchVariant(vIdx, { is_featured: v === "true" })}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">{t("dish.variantFeatured")}</SelectItem>
                                <SelectItem value="false">{t("dish.variantNotFeatured")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Variant Translations */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                              <Languages className="h-3 w-3" /> {t("dish.variantLocales")}
                            </span>
                            <Button type="button" size="sm" variant="outline"
                              onClick={() => addVariantLocaleRow(vIdx)}
                              disabled={variant.locales.length >= availableLocales.length}
                              className="h-6 text-xs px-2 gap-1"
                            >
                              <Plus className="h-3 w-3" /> {t("locale.add")}
                            </Button>
                          </div>
                          {variant.locales.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-1">{t("locale.empty.create")}</p>
                          ) : (
                            <div className="rounded-lg border divide-y">
                              {variant.locales.map((lRow, lIdx) => {
                                const usedLocaleIds = variant.locales
                                  .map((r, i) => i !== lIdx ? r.locale_id : null)
                                  .filter((v): v is number => typeof v === "number");
                                return (
                                  <div key={lIdx} className="p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">{t("locale.row.label", { n: lIdx + 1 })}</span>
                                      <Button type="button" size="icon" variant="ghost"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeVariantLocaleRow(vIdx, lIdx)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div className="sm:col-span-2 space-y-1">
                                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                                        <Select
                                          value={lRow.locale_id ? String(lRow.locale_id) : ""}
                                          onValueChange={(v) => updateVariantLocaleRow(vIdx, lIdx, { locale_id: Number(v) })}
                                        >
                                          <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder={t("placeholder.selectLanguage")} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableLocales.map((l) => (
                                              <SelectItem key={l.id} value={String(l.id)} disabled={usedLocaleIds.includes(l.id)}>
                                                {l.name} ({l.code})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                                        <Input type="number" value={lRow.sort_order}
                                          onChange={(e) => updateVariantLocaleRow(vIdx, lIdx, { sort_order: Number(e.target.value) })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                                      <Input value={lRow.name}
                                        onChange={(e) => updateVariantLocaleRow(vIdx, lIdx, { name: e.target.value })}
                                        placeholder={t("dish.namePlaceholder")}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                                      <Input value={lRow.description}
                                        onChange={(e) => updateVariantLocaleRow(vIdx, lIdx, { description: e.target.value })}
                                        placeholder={t("dish.descriptionPlaceholder")}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Recipe */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dish.recipe")}
                          </span>
                          <div className="rounded-lg border p-3 space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("dish.recipeCode")} *</Label>
                              <Input value={variant.recipe.code}
                                onChange={(e) => patchVariant(vIdx, { recipe: { ...variant.recipe, code: e.target.value } })}
                                placeholder="BURGER_CLASSIC_SINGLE"
                                className="h-9 text-sm font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{t("dish.ingredients")}</span>
                                <Button type="button" size="sm" variant="outline"
                                  onClick={() => addIngredientRow(vIdx)}
                                  className="h-6 text-xs px-2 gap-1"
                                >
                                  <Plus className="h-3 w-3" /> {t("dish.addIngredient")}
                                </Button>
                              </div>
                              {variant.recipe.ingredients.length === 0 ? (
                                <p className="text-xs text-muted-foreground">{t("dish.noIngredients")}</p>
                              ) : (
                                <div className="space-y-2">
                                  {variant.recipe.ingredients.map((ing, iIdx) => {
                                    const selectedItem = availableItems.find((it) => it.id === ing.item_id);
                                    const unitTypeId = selectedItem?.unit.unit_type.id;
                                    const unitsForType = unitTypeId ? (unitsByTypeId[unitTypeId] ?? []) : [];
                                    return (
                                      <div key={iIdx} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5">
                                          <Select value={ing.item_id ? String(ing.item_id) : ""}
                                            onValueChange={(v) => handleItemChange(vIdx, iIdx, v)}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue placeholder={t("dish.selectItem")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {availableItems.map((it) => (
                                                <SelectItem key={it.id} value={String(it.id)}>
                                                  {it.locales[0]?.name ? `${it.locales[0].name} (${it.code})` : it.code}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-3">
                                          <Input type="number" step="0.001" value={ing.quantity}
                                            onChange={(e) => updateIngredientRow(vIdx, iIdx, { quantity: Number(e.target.value) })}
                                            placeholder={t("dish.quantity")}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-3">
                                          <Select value={ing.unit_id ? String(ing.unit_id) : ""}
                                            onValueChange={(v) => updateIngredientRow(vIdx, iIdx, { unit_id: Number(v) })}
                                            disabled={!ing.item_id}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue placeholder={!ing.item_id ? "—" : t("dish.selectUnit")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {unitsForType.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                  {u.code}{u.locales[0]?.name ? ` — ${u.locales[0].name}` : ""}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                          <Button type="button" size="icon" variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeIngredientRow(vIdx, iIdx)}
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
