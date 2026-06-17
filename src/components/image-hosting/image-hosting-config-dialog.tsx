import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ServerIcon } from "lucide-react";
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
import { imageHostingConfigsService, type ImageHostingProvider, type ImageHostingProviderInfo } from "@/services/image-hosting-configs";
import { toast } from "sonner";
import type { ImageHostingConfigDialogMode, ImageHostingConfigFormState } from "./types";
import { ImageHostingConfigGeneralInfo } from "./image-hosting-config-general-info";

export const emptyImageHostingConfigForm: ImageHostingConfigFormState = {
  provider: "",
  config: {},
};

export interface ImageHostingConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ImageHostingConfigDialogMode;
  form: ImageHostingConfigFormState;
  onFormChange: (form: ImageHostingConfigFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function ImageHostingConfigDialog({
  open,
  onOpenChange,
  mode,
  form,
  onFormChange,
  onSaved,
}: ImageHostingConfigDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [providers, setProviders] = useState<ImageHostingProviderInfo[]>([]);
  const providersFetched = useRef(false);

  const loadProviders = useCallback(async () => {
    if (providersFetched.current) return;
    providersFetched.current = true;
    try {
      const data = await imageHostingConfigsService.getProviders();
      setProviders(data);
    } catch {
      providersFetched.current = false;
    }
  }, []);

  useEffect(() => {
    if (open && mode === "view") loadProviders();
    if (!open) setConfirmClose(false);
  }, [open, mode, loadProviders]);

  const isDirty = mode === "create"
    ? form.provider !== "" || Object.values(form.config).some((v) => v.trim() !== "")
    : false;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.provider) { toast.error(t("imageHosting.errProvider")); return; }
    const providerInfo = providers.find((p) => p.provider === form.provider);
    const requiredKeys = providerInfo?.required_keys ?? [];
    for (const rk of requiredKeys) {
      if (!form.config[rk.key]?.trim()) {
        toast.error(`${rk.label} is required.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const config: Record<string, string> = {};
      requiredKeys.forEach(({ key }) => { config[key] = form.config[key].trim(); });
      await imageHostingConfigsService.create({ provider: form.provider as ImageHostingProvider, config });
      toast.success(t("imageHosting.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const headerTitle = mode === "create" ? t("imageHosting.titleCreate") : t("imageHosting.titleView");
  const headerDesc = mode === "create" ? t("imageHosting.descCreate") : t("imageHosting.descView");

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader
              icon={<ServerIcon className="h-4 w-4" />}
              title={headerTitle}
              description={headerDesc}
            />
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <ImageHostingConfigGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                open={open}
                providers={providers}
                onProviderSelectOpen={loadProviders}
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
