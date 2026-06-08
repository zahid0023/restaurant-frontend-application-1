"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
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
import { DialogCreateFooter } from "@/components/commons/dialog-create-footer";
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory } from "@/services/item-categories";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { ItemCategoryDialogMode, ItemCategoryFormState } from "./types";
import { ItemCategoryGeneralInfo } from "./item-category-general-info";
import { ItemCategoryLocaleTranslations } from "./item-category-locale-translations";

export const emptyItemCategoryForm: ItemCategoryFormState = {
  parent_id: null,
  code: "",
  sort_order: 0,
  locales: [],
};

export interface ItemCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ItemCategoryDialogMode;
  itemTypeId: number;
  categoryId?: number;
  form: ItemCategoryFormState;
  onFormChange: (form: ItemCategoryFormState) => void;
  availableLocales: Locale[];
  availableParents: ItemCategory[];
  onSaved?: () => void | Promise<void>;
}

export function ItemCategoryDialog({
  open,
  onOpenChange,
  mode,
  itemTypeId,
  categoryId,
  form,
  onFormChange,
  availableLocales,
  availableParents,
  onSaved,
}: ItemCategoryDialogProps) {
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
    if (!form.code.trim()) { toast.error(t("itemCategory.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("itemCategory.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("itemCategory.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await itemCategoriesService.create(itemTypeId, {
        parent_id: form.parent_id ?? null,
        code,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(`${t("itemCategory.createdToast")} ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("itemCategory.titleCreate") : (isEditing ? t("itemCategory.titleEdit") : t("itemCategory.titleView"));
  const headerDesc = mode === "create" ? t("itemCategory.dialogDesc") : (isEditing ? t("itemCategory.dialogDescEdit") : t("itemCategory.dialogDescView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<Layers className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <ItemCategoryGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                itemTypeId={itemTypeId}
                categoryId={categoryId}
                availableParents={availableParents}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <ItemCategoryLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                itemTypeId={itemTypeId}
                categoryId={categoryId}
                availableLocales={availableLocales}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
              />
            </div>
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
