import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
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
import { menuCategoriesService } from "@/services/menu-categories";
import type { Locale } from "@/services/locales";
import type { Menu } from "@/services/menus";
import { toast } from "sonner";
import type { MenuCategoryDialogMode, MenuCategoryFormState } from "./types";
import { MenuCategoryGeneralInfo } from "./menu-category-general-info";
import { MenuCategoryLocaleTranslations } from "./menu-category-locale-translations";

export const emptyMenuCategoryForm: MenuCategoryFormState = {
  menu_type_id: "",
  code: "",
  sort_order: 0,
  locales: [],
};

export interface MenuCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: MenuCategoryDialogMode;
  categoryId?: number;
  form: MenuCategoryFormState;
  onFormChange: (form: MenuCategoryFormState) => void;
  availableLocales: Locale[];
  availableMenuTypes: Menu[];
  onSaved?: () => void | Promise<void>;
}

const randomCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export function MenuCategoryDialog({
  open,
  onOpenChange,
  mode,
  categoryId,
  form,
  onFormChange,
  availableLocales,
  availableMenuTypes,
  onSaved,
}: MenuCategoryDialogProps) {
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
    ? form.menu_type_id !== "" || form.code.trim() !== "" || form.locales.length > 0
    : generalEditing || translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.menu_type_id) { toast.error(t("menuCategory.errMenuType")); return; }
    if (!form.code.trim()) { toast.error(t("menuCategory.errCode")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("menuCategory.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("menuCategory.errLocaleName", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await menuCategoriesService.create({
        menu_type_id: Number(form.menu_type_id),
        code,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(`${t("menuCategory.createdToast")} ${code}`);
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("menuCategory.titleCreate") : (isEditing ? t("menuCategory.titleEdit") : t("menuCategory.titleView"));
  const headerDesc = mode === "create" ? t("menuCategory.descCreate") : (isEditing ? t("menuCategory.descEdit") : t("menuCategory.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader icon={<FolderOpen className="h-4 w-4" />} title={headerTitle} description={headerDesc} />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <MenuCategoryGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                categoryId={categoryId}
                availableMenuTypes={availableMenuTypes}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <MenuCategoryLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
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
