import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
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
  SECRET_KEY_NAMES,
  type ImageHostingProvider,
  type ImageHostingProviderInfo,
} from "@/services/image-hosting-configs";
import type { ImageHostingConfigDialogMode, ImageHostingConfigFormState } from "./types";

export interface ImageHostingConfigGeneralInfoProps {
  mode: ImageHostingConfigDialogMode;
  form: ImageHostingConfigFormState;
  onFormChange: (patch: Partial<ImageHostingConfigFormState>) => void;
  open: boolean;
  providers: ImageHostingProviderInfo[];
  onProviderSelectOpen: () => void;
}

export function ImageHostingConfigGeneralInfo({
  mode,
  form,
  onFormChange,
  open,
  providers,
  onProviderSelectOpen,
}: ImageHostingConfigGeneralInfoProps) {
  const { t } = useTranslation();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) setShowSecrets({});
  }, [open]);

  function handleProviderChange(newProvider: ImageHostingProvider) {
    const providerInfo = providers.find((p) => p.provider === newProvider);
    const newConfig: Record<string, string> = {};
    (providerInfo?.required_keys ?? []).forEach(({ key }) => { newConfig[key] = ""; });
    onFormChange({ provider: newProvider, config: newConfig });
  }

  function toggleSecret(key: string) {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const isReadOnly = mode === "view";
  const activeProviderInfo = providers.find((p) => p.provider === form.provider);
  // In view mode fall back to raw keys from config if providers haven't loaded yet
  const displayFields = activeProviderInfo?.required_keys
    ?? (isReadOnly ? Object.keys(form.config).map((key) => ({ key, label: key })) : []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {t("imageHosting.configSection")}
        </h3>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("imageHosting.provider")}{!isReadOnly && " *"}</Label>
            {isReadOnly ? (
              <Input value={activeProviderInfo?.label ?? form.provider} disabled />
            ) : (
              <Select
                value={form.provider}
                onValueChange={(v) => handleProviderChange(v as ImageHostingProvider)}
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
            )}
          </div>

          {displayFields.map((rk) => (
            <div key={rk.key} className="space-y-2">
              <Label className="text-xs font-medium">{rk.label}{!isReadOnly && " *"}</Label>
              <div className="relative">
                <Input
                  type={SECRET_KEY_NAMES.has(rk.key) && !showSecrets[rk.key] ? "password" : "text"}
                  value={form.config[rk.key] ?? ""}
                  onChange={(e) => onFormChange({ config: { ...form.config, [rk.key]: e.target.value } })}
                  placeholder={isReadOnly ? undefined : rk.label}
                  disabled={isReadOnly}
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
