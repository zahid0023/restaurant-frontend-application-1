import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface DialogCreateFooterProps {
  submitting: boolean;
  onCancel: () => void;
}

export function DialogCreateFooter({ submitting, onCancel }: DialogCreateFooterProps) {
  const { t } = useTranslation();
  return (
    <DialogFooter className="shrink-0 px-6 py-4 border-t bg-muted/40">
      <div className="flex items-center gap-2 w-full justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="gap-1.5">
          <X className="h-3.5 w-3.5" /> {t("common.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
          <Check className="h-3.5 w-3.5" />
          {submitting ? t("common.saving") : t("common.create")}
        </Button>
      </div>
    </DialogFooter>
  );
}
