import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LayersIcon } from "lucide-react";
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
import { diningSpaceTypesService } from "@/services/dining-space-types";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { DiningSpaceTypeDialogMode, DiningSpaceTypeFormState } from "./types";
import { DiningSpaceTypeGeneralInfo } from "./dining-space-type-general-info";
import { DiningSpaceTypeLocaleTranslations } from "./dining-space-type-locale-translations";

export const emptyDiningSpaceTypeForm: DiningSpaceTypeFormState = {
  code: "",
  sort_order: 0,
  locales: [],
};

export interface DiningSpaceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DiningSpaceTypeDialogMode;
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
  typeId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: DiningSpaceTypeDialogProps) {
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
    if (!form.code.trim()) { toast.error(t("diningSpaceType.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("diningSpaceType.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("diningSpaceType.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await diningSpaceTypesService.create({
        code,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(`${t("diningSpaceType.createdToast")} ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("diningSpaceType.titleCreate") : (isEditing ? t("diningSpaceType.titleEdit") : t("diningSpaceType.titleView"));
  const headerDesc = mode === "create" ? t("diningSpaceType.descCreate") : (isEditing ? t("diningSpaceType.descEdit") : t("diningSpaceType.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<LayersIcon className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <DiningSpaceTypeGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                typeId={typeId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <DiningSpaceTypeLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                typeId={typeId}
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
