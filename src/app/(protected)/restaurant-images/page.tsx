"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Check,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  restaurantImagesService,
  type RestaurantImage,
  type UploadImageMeta,
} from "@/services/restaurant-images";
import { imageHostingConfigsService, type ImageHostingConfig } from "@/services/image-hosting-configs";

interface FileMeta {
  file: File;
  preview: string;
  caption: string;
}

interface EditState {
  caption: string;
  sort_order: string;
}

export default function RestaurantImagesPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [images, setImages] = useState<RestaurantImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [configs, setConfigs] = useState<ImageHostingConfig[]>([]);
  const [configId, setConfigId] = useState<string>("");
  const [fileMetas, setFileMetas] = useState<FileMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({ caption: "", sort_order: "0" });
  const [saving, setSaving] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState<RestaurantImage | null>(null);

  // lightbox
  const [lightboxImage, setLightboxImage] = useState<RestaurantImage | null>(null);

  const fetchImages = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await restaurantImagesService.list(p, 20);
      const items = res.content ?? (res as unknown as { data?: RestaurantImage[] }).data ?? [];
      if (p === 0) {
        setImages(items);
      } else {
        setImages((prev) => [...prev, ...items]);
      }
      setTotalPages(res.total_pages ?? 1);
      setPage(p);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages(0);
  }, [fetchImages]);

  async function openUpload() {
    setFileMetas([]);
    setConfigId("");
    try {
      const res = await imageHostingConfigsService.list({ size: 50, sort_by: "id" });
      if (res.data.length === 0) {
        toast.error(t("restaurantImages.errNoHostingConfig"), {
          action: {
            label: t("restaurantImages.configureHosting"),
            onClick: () => router.push("/image-hosting"),
          },
        });
        return;
      }
      setConfigs(res.data);
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }
    setUploadOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFileMetas((prev) => {
      const existingNames = new Set(prev.map((m) => m.file.name));
      const distinct = files.filter((f) => !existingNames.has(f.name));
      const newMetas: FileMeta[] = distinct.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        caption: "",
      }));
      return [...prev, ...newMetas];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx: number) {
    setFileMetas((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function updateMeta(idx: number, patch: Partial<FileMeta>) {
    setFileMetas((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  async function handleUpload() {
    if (!configId) {
      toast.error(t("restaurantImages.errNoConfig"));
      return;
    }
    if (fileMetas.length === 0) {
      toast.error(t("restaurantImages.errNoFiles"));
      return;
    }
    setUploading(true);
    try {
      const metas: UploadImageMeta[] = fileMetas.map((m) => ({
        client_image_id: m.file.name,
        caption: m.caption || undefined,
      }));
      await restaurantImagesService.upload(parseInt(configId), fileMetas.map((m) => m.file), metas);
      toast.success(t("restaurantImages.uploadedToast"));
      setUploadOpen(false);
      fileMetas.forEach((m) => URL.revokeObjectURL(m.preview));
      setFileMetas([]);
      fetchImages(0);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function startEdit(img: RestaurantImage) {
    setEditingId(img.id);
    setEditState({ caption: img.caption ?? "", sort_order: String(img.sort_order) });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      await restaurantImagesService.update(id, {
        caption: editState.caption || undefined,
        sort_order: parseInt(editState.sort_order) || 0,
      });
      toast.success(t("common.saved"));
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, caption: editState.caption || undefined, sort_order: parseInt(editState.sort_order) || 0 }
            : img
        )
      );
      setEditingId(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await restaurantImagesService.remove(deleteTarget.id);
      toast.success(t("restaurantImages.deletedToast"));
      setDeleteTarget(null);
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("restaurantImages.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("restaurantImages.pageSubtitle")}</p>
        </div>
        <Button onClick={openUpload}>
          <Upload className="h-4 w-4 mr-1.5" />
          {t("restaurantImages.upload")}
        </Button>
      </div>

      {/* Gallery */}
      {loading && images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">{t("restaurantImages.loading")}</div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed flex flex-col items-center gap-3">
          <ImageIcon className="h-10 w-10 opacity-30" />
          <p>{t("restaurantImages.empty")}</p>
          <Button variant="outline" size="sm" onClick={openUpload}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t("restaurantImages.upload")}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden gap-0 py-0">
                {/* Thumbnail */}
                <div
                  className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden cursor-zoom-in"
                  onClick={() => editingId !== img.id && setLightboxImage(img)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption ?? ""}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                  {img.is_default && (
                    <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                      {t("restaurantImages.default")}
                    </Badge>
                  )}
                  {editingId !== img.id && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <CardContent className="px-3 py-3 space-y-2">
                  {editingId === img.id ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("restaurantImages.caption")}</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editState.caption}
                          onChange={(e) => setEditState((s) => ({ ...s, caption: e.target.value }))}
                          placeholder={t("restaurantImages.captionPlaceholder")}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("restaurantImages.sortOrder")}</Label>
                        <Input
                          className="h-7 text-xs"
                          type="number"
                          value={editState.sort_order}
                          onChange={(e) => setEditState((s) => ({ ...s, sort_order: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button size="sm" className="h-7 text-xs flex-1" disabled={saving} onClick={() => saveEdit(img.id)}>
                          <Check className="h-3 w-3 mr-1" />
                          {t("common.save")}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm truncate text-muted-foreground min-h-[1.25rem]">
                        {img.caption || <span className="italic opacity-50">{t("restaurantImages.noCaption")}</span>}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          #{img.sort_order}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEdit(img)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(img)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {page + 1 < totalPages && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" disabled={loading} onClick={() => fetchImages(page + 1)}>
                {loading ? t("restaurantImages.loading") : t("restaurantImages.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={(o) => !o && setLightboxImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0 gap-0 bg-black/90 border-0">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {lightboxImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.caption ?? ""}
                  className="max-h-[80vh] max-w-full object-contain"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 text-white hover:text-white hover:bg-white/20"
                  onClick={() => setLightboxImage(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
                {lightboxImage.caption && (
                  <p className="absolute bottom-0 left-0 right-0 text-center text-sm text-white/80 bg-black/50 py-2 px-4">
                    {lightboxImage.caption}
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 py-5 bg-muted/40 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{t("restaurantImages.uploadTitle")}</DialogTitle>
                <DialogDescription>{t("restaurantImages.uploadDesc")}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Config Select */}
            <Card>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("restaurantImages.hostingConfig")}</Label>
                  <Select value={configId} onValueChange={setConfigId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("restaurantImages.selectConfig")} />
                    </SelectTrigger>
                    <SelectContent>
                      {configs.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} <span className="text-muted-foreground ml-1 text-xs">({c.provider})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* File Drop Zone */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed rounded-lg py-8 text-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t("restaurantImages.dropOrClick")}</p>
                <p className="text-xs mt-1 opacity-60">{t("restaurantImages.imageFormats")}</p>
              </button>
            </div>

            {/* File List */}
            {fileMetas.length > 0 && (
              <div className="space-y-3">
                {fileMetas.map((meta, idx) => (
                  <Card key={idx} className="overflow-hidden gap-0 py-0">
                    <div className="flex gap-3 p-3">
                      {/* Preview */}
                      <div className="h-16 w-24 rounded bg-muted overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={meta.preview} alt="" className="h-full w-full object-cover" />
                      </div>
                      {/* Fields */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-xs font-medium truncate text-muted-foreground">{meta.file.name}</p>
                        <Input
                          className="h-7 text-xs"
                          placeholder={t("restaurantImages.captionPlaceholder")}
                          value={meta.caption}
                          onChange={(e) => updateMeta(idx, { caption: e.target.value })}
                        />
                      </div>
                      {/* Remove */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeFile(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 px-6 py-4 border-t bg-muted/40">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={uploading || fileMetas.length === 0} onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-1.5" />
              {uploading ? t("restaurantImages.uploading") : t("restaurantImages.uploadBtn", { count: fileMetas.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("restaurantImages.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("restaurantImages.deleteDesc")}</AlertDialogDescription>
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
