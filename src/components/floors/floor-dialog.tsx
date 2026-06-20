import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LayoutTemplate } from "lucide-react";
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
import { floorsService } from "@/services/floors";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { FloorDialogMode, FloorFormState } from "./types";
import { FloorGeneralInfo } from "./floor-general-info";
import { FloorLocaleTranslations } from "./floor-locale-translations";

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

const randomCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

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
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open && mode === "create") {
      onFormChange({ ...form, code: randomCode() });
    }
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setConfirmClose(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("floor.titleCreate") : (isEditing ? t("floor.titleEdit") : t("floor.titleView"));
  const headerDesc = mode === "create" ? t("floor.descCreate") : (isEditing ? t("floor.descEdit") : t("floor.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<LayoutTemplate className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <FloorGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                floorId={floorId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <FloorLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                floorId={floorId}
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
