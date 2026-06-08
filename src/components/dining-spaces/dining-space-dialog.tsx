import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BlocksIcon } from "lucide-react";
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
import { diningSpacesService } from "@/services/dining-spaces";
import type { Floor } from "@/services/floors";
import type { DiningSpaceType } from "@/services/dining-space-types";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { DiningSpaceDialogMode, DiningSpaceFormState } from "./types";
import { DiningSpaceGeneralInfo } from "./dining-space-general-info";
import { DiningSpaceLocaleTranslations } from "./dining-space-locale-translations";

export const emptyDiningSpaceForm: DiningSpaceFormState = {
  dining_space_type_id: "",
  floor_id: null,
  code: "",
  sort_order: 0,
  capacity: 1,
  is_bookable: true,
  locales: [],
};

export interface DiningSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DiningSpaceDialogMode;
  spaceId?: number;
  form: DiningSpaceFormState;
  onFormChange: (form: DiningSpaceFormState) => void;
  availableLocales: Locale[];
  availableFloors: Floor[];
  availableTypes: DiningSpaceType[];
  onSaved?: () => void | Promise<void>;
}

export function DiningSpaceDialog({
  open,
  onOpenChange,
  mode,
  spaceId,
  form,
  onFormChange,
  availableLocales,
  availableFloors,
  availableTypes,
  onSaved,
}: DiningSpaceDialogProps) {
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
    ? form.code.trim() !== "" || String(form.dining_space_type_id) !== "" || form.locales.length > 0
    : generalEditing || translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.dining_space_type_id) { toast.error(t("diningSpace.errType")); return; }
    if (!form.code.trim()) { toast.error(t("diningSpace.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("diningSpace.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("diningSpace.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await diningSpacesService.create({
        dining_space_type_id: Number(form.dining_space_type_id),
        floor_id: form.floor_id ?? null,
        code,
        sort_order: Number(form.sort_order) || 0,
        capacity: Number(form.capacity) || 1,
        is_bookable: form.is_bookable,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(`${t("diningSpace.createdToast")} ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("diningSpace.titleCreate") : (isEditing ? t("diningSpace.titleEdit") : t("diningSpace.titleView"));
  const headerDesc = mode === "create" ? t("diningSpace.descCreate") : (isEditing ? t("diningSpace.descEdit") : t("diningSpace.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<BlocksIcon className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <DiningSpaceGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                spaceId={spaceId}
                availableFloors={availableFloors}
                availableTypes={availableTypes}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <DiningSpaceLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                spaceId={spaceId}
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
