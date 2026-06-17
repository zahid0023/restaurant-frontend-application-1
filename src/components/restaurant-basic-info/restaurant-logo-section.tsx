"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, ImageIcon, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { restaurantBasicInfoService } from "@/services/restaurant-basic-info";
import { imageHostingConfigsService, type ImageHostingConfig } from "@/services/image-hosting-configs";
import { toast } from "sonner";
import type { RestaurantFormState } from "./types";

export interface RestaurantLogoSectionProps {
  form: RestaurantFormState;
  onFormChange: (patch: Partial<RestaurantFormState>) => void;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
}

export function RestaurantLogoSection({
  form,
  onSaved,
  editing,
  onEditingChange,
}: RestaurantLogoSectionProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [configs, setConfigs] = useState<ImageHostingConfig[]>([]);
  const [configId, setConfigId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  async function startEdit() {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setConfigId("");
    onEditingChange(true);
    try {
      const res = await imageHostingConfigsService.list({ size: 50, sort_by: "id" });
      setConfigs(res.data);
    } catch {
      // configs list failed — user can still see the empty select
    }
  }

  function cancel() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setConfigId("");
    onEditingChange(false);
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  }

  function clearFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function save() {
    if (!selectedFile) { toast.error(t("restaurantInfo.errNoFile")); return; }
    if (!configId) { toast.error(t("restaurantInfo.errNoConfig")); return; }
    setSubmitting(true);
    try {
      await restaurantBasicInfoService.uploadLogo(Number(configId), selectedFile);
      toast.success(t("restaurantInfo.uploadedToast"));
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setConfigId("");
      onEditingChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const previewSrc = editing ? filePreviewUrl : (form.logo_url || null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("restaurantInfo.logo")}
          </h3>
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={cancel} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
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
          {editing ? (
            <>
              {/* Hosting config selector */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t("restaurantInfo.hostingConfig")} *</Label>
                <Select value={configId} onValueChange={setConfigId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("restaurantInfo.selectHostingConfig")} />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.provider})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  "relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer select-none",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                  previewSrc ? "p-3" : "p-10 gap-3"
                )}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {previewSrc ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt={t("restaurantInfo.logo")}
                      className="max-h-48 max-w-full rounded-md object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t("restaurantInfo.dropOrClick")}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{t("restaurantInfo.imageFormats")}</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </>
          ) : form.logo_url ? (
            <div className="flex justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.logo_url}
                alt={t("restaurantInfo.logo")}
                className="max-h-48 max-w-full rounded-md object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">{t("restaurantInfo.noLogo")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
