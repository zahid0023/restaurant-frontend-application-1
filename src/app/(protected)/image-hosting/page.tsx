"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ImageHostingConfigCard } from "@/components/image-hosting/image-hosting-config-card";
import {
  ImageHostingConfigDialog,
  emptyImageHostingConfigForm,
} from "@/components/image-hosting/image-hosting-config-dialog";
import type { ImageHostingConfigDialogMode, ImageHostingConfigFormState } from "@/components/image-hosting/types";
import { imageHostingConfigsService, type ImageHostingConfig } from "@/services/image-hosting-configs";
import { toast } from "sonner";

export default function ImageHostingPage() {
  const { t } = useTranslation();

  const [configs, setConfigs] = useState<ImageHostingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ImageHostingConfigDialogMode>("create");
  const [activeConfigId, setActiveConfigId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ImageHostingConfigFormState>(emptyImageHostingConfigForm);

  const [deleteTarget, setDeleteTarget] = useState<ImageHostingConfig | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await imageHostingConfigsService.list({ size: 50, sort_by: "id" });
      setConfigs(res.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniqueProviders = useMemo(() => [...new Set(configs.map((c) => c.provider))], [configs]);

  const filtered = useMemo(() => {
    if (providerFilter === "all") return configs;
    return configs.filter((c) => c.provider === providerFilter);
  }, [configs, providerFilter]);

  function openCreate() {
    setMode("create");
    setActiveConfigId(undefined);
    setForm(emptyImageHostingConfigForm);
    setDialogOpen(true);
  }

  function openView(c: ImageHostingConfig) {
    setMode("view");
    setActiveConfigId(c.id);
    setForm({ name: c.name, provider: c.provider, config: c.config });
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await imageHostingConfigsService.remove(deleteTarget.id);
      toast.success(t("imageHosting.deletedToast"));
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("imageHosting.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("imageHosting.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-40 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allFields")}</SelectItem>
              {uniqueProviders.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("imageHosting.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("imageHosting.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("imageHosting.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ImageHostingConfigCard
              key={c.id}
              config={c}
              onView={() => openView(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      <ImageHostingConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        configId={activeConfigId}
        form={form}
        onFormChange={setForm}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("imageHosting.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("imageHosting.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
