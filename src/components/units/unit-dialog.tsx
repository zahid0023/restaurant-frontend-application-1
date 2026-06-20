"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";
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
import { unitsService } from "@/services/units";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { UnitDialogMode, UnitFormState } from "./types";
import { UnitGeneralInfo } from "./unit-general-info";
import { UnitLocaleTranslations } from "./unit-locale-translations";

export const emptyUnitForm: UnitFormState = {
  code: "",
  is_base: false,
  sort_order: 0,
  locales: [],
};

export interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: UnitDialogMode;
  unitTypeId: number;
  unitId?: number;
  form: UnitFormState;
  onFormChange: (form: UnitFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

const randomCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export function UnitDialog({
  open,
  onOpenChange,
  mode,
  unitTypeId,
  unitId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: UnitDialogProps) {
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
    if (!form.code.trim()) { toast.error(t("unit.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("unit.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("unit.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await unitsService.create(unitTypeId, {
        code,
        is_base: form.is_base,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(`${t("unit.createdToast")} ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("unit.titleCreate") : (isEditing ? t("unit.titleEdit") : t("unit.titleView"));
  const headerDesc = mode === "create" ? t("unit.descCreate") : (isEditing ? t("unit.descEdit") : t("unit.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<Scale className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <UnitGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                unitTypeId={unitTypeId}
                unitId={unitId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <UnitLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                unitTypeId={unitTypeId}
                unitId={unitId}
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
