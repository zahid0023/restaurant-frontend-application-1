"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, ChefHat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DialogEntityHeader } from "@/components/commons/dialog-entity-header";
import { DishVariantGeneralInfo } from "./dish-variant-general-info";
import { DishVariantLocaleTranslations, type VariantLocaleFormRow } from "./dish-variant-locale-translations";
import { DishVariantIngredients } from "./dish-variant-ingredients";
import { dishesService } from "@/services/dishes";
import type { DishVariant } from "@/services/dishes";
import type { Locale } from "@/services/locales";
import type { Unit } from "@/services/units";
import type { IngredientRow } from "./ingredients-table";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateForm {
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_veg: boolean;
  locales: VariantLocaleFormRow[];
  ingredients: IngredientRow[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DishVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "view";
  dishId: number;
  variant?: DishVariant;
  availableLocales: Locale[];
  unitsByTypeId: Record<number, Unit[]>;
  onUnitTypeLoad?: (unitTypeId: number, units: Unit[]) => void;
  onSaved?: () => void | Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DishVariantDialog({
  open,
  onOpenChange,
  mode,
  dishId,
  variant,
  availableLocales,
  unitsByTypeId,
  onUnitTypeLoad,
  onSaved,
}: DishVariantDialogProps) {
  const { t } = useTranslation();

  // ── Step ───────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Create-mode form state ──────────────────────────────────────────────────
  const [form, setForm] = useState<CreateForm>({
    code: "",
    sort_order: 1,
    price: 0,
    is_default: false,
    is_veg: false,
    locales: [],
    ingredients: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // ── Reset on close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm({ code: "", sort_order: 1, price: 0, is_default: false, is_veg: false, locales: [], ingredients: [] });
      setSubmitting(false);
      setConfirmClose(false);
    }
  }, [open]);

  // ── Dirty check ────────────────────────────────────────────────────────────
  const isDirty =
    mode === "create"
      ? form.code.trim() !== "" || form.locales.length > 0 || form.ingredients.length > 0
      : false;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // ── Step 1 → 2 validation (create mode) ───────────────────────────────────
  function goToStep2() {
    if (!form.code.trim()) { toast.error(t("dish.errVariantCode", { n: 1 })); return; }
    if (form.locales.length === 0) { toast.error(t("dish.errAtLeastOneLocale")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("dish.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("dish.errLocaleName", { n: i + 1 })); return; }
    }
    setStep(2);
  }

  // ── Submit (create mode) ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (form.ingredients.length === 0) { toast.error(t("dish.errAtLeastOneIngredient")); return; }
    for (const [i, ing] of form.ingredients.entries()) {
      if (!ing.item_id) { toast.error(t("dish.errIngredientItem", { n: 1, m: i + 1 })); return; }
      if (!ing.unit_id) { toast.error(t("dish.errIngredientUnit", { n: 1, m: i + 1 })); return; }
      if (!ing.quantity || ing.quantity <= 0) { toast.error(t("dish.errIngredientQty", { n: 1, m: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await dishesService.addVariant(dishId, {
        code,
        sort_order: Number(form.sort_order) || 0,
        price: Number(form.price) || 0,
        is_default: form.is_default,
        is_veg: form.is_veg,
        locales: form.locales.map((r) => ({
          locale_id: Number(r.locale_id),
          name: r.name.trim(),
          description: r.description?.trim() || undefined,
          sort_order: Number(r.sort_order) || 0,
        })),
        ingredients: form.ingredients.map((ing, i) => ({
          item_id: Number(ing.item_id),
          quantity: Number(ing.quantity),
          unit_id: Number(ing.unit_id),
          sort_order: Number(ing.sort_order) || i + 1,
        })),
      });
      toast.success(t("dish.variantCreated"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Step indicator ────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: t("dish.variantStepDetails") },
    { n: 2, label: t("dish.variantStepIngredients") },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            {/* HEADER */}
            <DialogEntityHeader
              icon={<ChefHat className="h-4 w-4" />}
              title={mode === "create" ? t("dish.variantTitleCreate") : t("dish.variantTitleView")}
              description={mode === "create" ? t("dish.variantDescCreate") : t("dish.variantDescView")}
            />

            {/* STEP INDICATOR */}
            <div className="shrink-0 flex items-center gap-0 border-b bg-muted/20">
              {steps.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    if (mode === "create" && s.n === 2) { goToStep2(); return; }
                    setStep(s.n);
                  }}
                  className={[
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors",
                    step === s.n
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground border-b-2 border-transparent",
                  ].join(" ")}
                >
                  <span className={[
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    step === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  ].join(" ")}>
                    {s.n}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ══ STEP 1: General Info + Translations ══ */}
              {step === 1 && (
                <>
                  <DishVariantGeneralInfo
                    key={`general-${variant?.id ?? "new"}-${open}`}
                    mode={mode}
                    dishId={dishId}
                    variantId={variant?.id}
                    code={mode === "create" ? form.code : (variant?.code ?? "")}
                    sortOrder={mode === "create" ? form.sort_order : (variant?.sort_order ?? 1)}
                    price={mode === "create" ? form.price : (variant?.price ?? 0)}
                    isDefault={mode === "create" ? form.is_default : (variant?.is_default ?? false)}
                    isVeg={mode === "create" ? form.is_veg : (variant?.is_veg ?? false)}
                    onCodeChange={(v) => setForm((prev) => ({ ...prev, code: v }))}
                    onSortOrderChange={(v) => setForm((prev) => ({ ...prev, sort_order: v }))}
                    onPriceChange={(v) => setForm((prev) => ({ ...prev, price: v }))}
                    onIsDefaultChange={(v) => setForm((prev) => ({ ...prev, is_default: v }))}
                    onIsVegChange={(v) => setForm((prev) => ({ ...prev, is_veg: v }))}
                    onSaved={onSaved}
                  />

                  <DishVariantLocaleTranslations
                    key={`locales-${variant?.id ?? "new"}-${open}`}
                    mode={mode}
                    dishId={dishId}
                    variantId={variant?.id}
                    locales={mode === "create" ? form.locales : undefined}
                    onLocalesChange={(rows) => setForm((prev) => ({ ...prev, locales: rows }))}
                    savedLocales={mode === "view" ? (variant?.locales ?? []) : undefined}
                    availableLocales={availableLocales}
                    onSaved={onSaved}
                  />
                </>
              )}

              {/* ══ STEP 2: Ingredients ══ */}
              {step === 2 && (
                <DishVariantIngredients
                  key={`ingredients-${variant?.id ?? "new"}-${open}`}
                  mode={mode}
                  dishId={dishId}
                  variantId={variant?.id}
                  rows={mode === "create" ? form.ingredients : undefined}
                  onRowsChange={(rows) => setForm((prev) => ({ ...prev, ingredients: rows }))}
                  savedRows={mode === "view" ? (variant?.ingredients ?? []) : undefined}
                  unitsByTypeId={unitsByTypeId}
                  onUnitTypeLoad={onUnitTypeLoad}
                  onSaved={onSaved}
                />
              )}

            </div>

            {/* FOOTER */}
            <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-between gap-2">
              {/* Left */}
              {step === 2 ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> {t("common.prev")}
                </Button>
              ) : (
                <Button type="button" size="sm" variant="ghost" onClick={requestClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
              )}

              {/* Right */}
              {mode === "create" && step === 1 && (
                <Button type="button" size="sm" onClick={goToStep2} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              {mode === "create" && step === 2 && (
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {submitting ? t("common.saving") : t("common.create")}
                </Button>
              )}
              {mode === "view" && step === 1 && (
                <Button type="button" size="sm" variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm close */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmClose(false); onOpenChange(false); }}>
              {t("dialog.discardChanges.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
