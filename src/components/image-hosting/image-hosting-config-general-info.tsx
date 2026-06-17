import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Eye, EyeOff, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  imageHostingConfigsService,
  SECRET_KEY_NAMES,
  type ImageHostingProvider,
  type ImageHostingProviderInfo,
} from "@/services/image-hosting-configs";
import { toast } from "sonner";
import type { ImageHostingConfigDialogMode, ImageHostingConfigFormState } from "./types";

export interface ImageHostingConfigGeneralInfoProps {
  mode: ImageHostingConfigDialogMode;
  form: ImageHostingConfigFormState;
  onFormChange: (patch: Partial<ImageHostingConfigFormState>) => void;
  open: boolean;
  providers: ImageHostingProviderInfo[];
  onProviderSelectOpen: () => void;
  configId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
}

export function ImageHostingConfigGeneralInfo({
  mode,
  form,
  onFormChange,
  open,
  providers,
  onProviderSelectOpen,
  configId,
  onSaved,
  editing,
  onEditingChange,
}: ImageHostingConfigGeneralInfoProps) {
  const { t } = useTranslation();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [localName, setLocalName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowSecrets({});
      setSubmitting(false);
    }
  }, [open]);

  function startEdit() {
    setLocalName(form.name);
    onEditingChange(true);
  }

  async function save() {
    if (!localName.trim()) { toast.error(t("imageHosting.errName")); return; }
    if (configId == null) return;
    setSubmitting(true);
    try {
      await imageHostingConfigsService.update(configId, { name: localName.trim() });
      toast.success(t("imageHosting.updatedToast"));
      onFormChange({ name: localName.trim() });
      onEditingChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSecret(key: string) {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const isCreate = mode === "create";
  const isReadOnly = mode === "view" && !editing;

  const activeProviderInfo = providers.find((p) => p.provider === form.provider);
  const displayFields = activeProviderInfo?.required_keys
    ?? (mode === "view" ? Object.keys(form.config).map((key) => ({ key, label: key })) : []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("imageHosting.configSection")}
          </h3>
        </div>
        {mode === "view" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {t("imageHosting.name")}{(isCreate || editing) && " *"}
            </Label>
            <Input
              value={editing ? localName : form.name}
              onChange={(e) => {
                if (editing) setLocalName(e.target.value);
                else if (isCreate) onFormChange({ name: e.target.value });
              }}
              placeholder={isReadOnly ? undefined : t("imageHosting.name")}
              disabled={isReadOnly}
            />
          </div>

          {/* Provider field */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {t("imageHosting.provider")}{isCreate && " *"}
            </Label>
            {isCreate ? (
              <Select
                value={form.provider}
                onValueChange={(v) => {
                  onProviderSelectOpen();
                  const providerInfo = providers.find((p) => p.provider === v);
                  const newConfig: Record<string, string> = {};
                  (providerInfo?.required_keys ?? []).forEach(({ key }) => { newConfig[key] = ""; });
                  onFormChange({ provider: v as ImageHostingProvider, config: newConfig });
                }}
                onOpenChange={(o) => { if (o) onProviderSelectOpen(); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("imageHosting.selectProvider")} />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.provider} value={p.provider}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={activeProviderInfo?.label ?? form.provider} disabled onChange={() => {}} />
            )}
          </div>

          {/* Config key fields */}
          {displayFields.map((rk) => (
            <div key={rk.key} className="space-y-2">
              <Label className="text-xs font-medium">
                {rk.label}{isCreate && " *"}
              </Label>
              <div className="relative">
                <Input
                  type={SECRET_KEY_NAMES.has(rk.key) && !showSecrets[rk.key] ? "password" : "text"}
                  value={form.config[rk.key] ?? ""}
                  onChange={(e) => {
                    if (isCreate) {
                      onFormChange({ config: { ...form.config, [rk.key]: e.target.value } });
                    }
                  }}
                  placeholder={isCreate ? rk.label : undefined}
                  disabled={!isCreate}
                  className={SECRET_KEY_NAMES.has(rk.key) ? "pr-10" : undefined}
                />
                {SECRET_KEY_NAMES.has(rk.key) && (
                  <button
                    type="button"
                    onClick={() => toggleSecret(rk.key)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showSecrets[rk.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
