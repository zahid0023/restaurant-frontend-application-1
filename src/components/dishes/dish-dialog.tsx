"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UtensilsCrossed } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
import { DialogCreateFooter } from "@/components/commons/dialog-create-footer";
import { DialogEntityHeader } from "@/components/commons/dialog-entity-header";
import { dishesService } from "@/services/dishes";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { DishDialogMode, DishFormState } from "./types";
import { DishGeneralInfo } from "./dish-general-info";
import { DishLocaleTranslations } from "./dish-locale-translations";

export const emptyDishForm: DishFormState = {
  code: "",
  sort_order: 0,
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
};

export interface DishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DishDialogMode;
  dishId?: number;
  form: DishFormState;
  onFormChange: (form: DishFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function DishDialog({
  open,
  onOpenChange,
  mode,
  dishId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: DishDialogProps) {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setConfirmClose(false);
    }
  }, [open]);

  const isDirty = mode === "create"
    ? form.code.trim() !== "" || form.locales.length > 0
    : generalEditing || translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("dish.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("dish.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("dish.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await dishesService.create({
        code,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(t("dish.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("dish.titleCreate") : (isEditing ? t("dish.titleEdit") : t("dish.titleView"));
  const headerDesc = mode === "create" ? t("dish.descCreate") : (isEditing ? t("dish.descEdit") : t("dish.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            {/* HEADER */}
            <DialogEntityHeader
              icon={<UtensilsCrossed className="h-4 w-4" />}
              title={headerTitle}
              description={headerDesc}
            />

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              <DishGeneralInfo
                mode={mode}
                dishId={dishId}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />

              <DishLocaleTranslations
                mode={mode}
                dishId={dishId}
                form={form}
                onFormChange={onFormChange}
                availableLocales={availableLocales}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
              />

            </div>

            {/* FOOTER (create mode only) */}
            {mode === "create" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} />
            )}

          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>{t("dialog.discardChanges.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
