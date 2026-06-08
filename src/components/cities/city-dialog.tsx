import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
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
import { citiesService } from "@/services/cities";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { CityDialogMode, CityFormState } from "./types";
import { CityGeneralInfo } from "./city-general-info";
import { CityLocaleTranslations } from "./city-locale-translations";

export const emptyCityForm: CityFormState = {
  code: "",
  sort_order: 0,
  locales: [],
};

export interface CityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CityDialogMode;
  countryId: number;
  cityId?: number;
  form: CityFormState;
  onFormChange: (form: CityFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function CityDialog({
  open,
  onOpenChange,
  mode,
  countryId,
  cityId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: CityDialogProps) {
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
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("toast.localeSelectLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("toast.localeNameRequired", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      await citiesService.create(countryId, {
        code: form.code.trim() || undefined,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(t("cities.created"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("dialog.city.new") : (isEditing ? t("dialog.city.edit") : t("dialog.city.view"));
  const headerDesc = mode === "create" ? t("dialog.city.desc.create") : (isEditing ? t("dialog.city.desc.edit") : t("dialog.city.desc.view"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<MapPin className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <CityGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                countryId={countryId}
                cityId={cityId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <CityLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                countryId={countryId}
                cityId={cityId}
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
