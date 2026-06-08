import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
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
import { itemsService } from "@/services/items";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { ItemDialogMode, ItemFormState } from "./types";
import { ItemGeneralInfo } from "./item-general-info";
import { ItemLocaleTranslations } from "./item-locale-translations";

export const emptyItemForm: ItemFormState = {
  code: "",
  item_type_id: "",
  unit_type_id: "",
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
    ? form.code.trim() !== "" || String(form.item_type_id) !== "" || String(form.unit_type_id) !== "" || form.locales.length > 0
    : generalEditing || translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("item.errCode")); return; }
    if (!form.item_type_id) { toast.error(t("item.errItemType")); return; }
    if (!form.unit_type_id) { toast.error(t("item.errUnitType")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("item.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("item.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await itemsService.create({
        code,
        item_type_id: Number(form.item_type_id),
        unit_type_id: Number(form.unit_type_id),
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

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("item.titleCreate") : (isEditing ? t("item.titleEdit") : t("item.titleView"));
  const headerDesc = mode === "create" ? t("item.descCreate") : (isEditing ? t("item.descEdit") : t("item.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<Package className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <ItemGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                itemId={itemId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <ItemLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                itemId={itemId}
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
