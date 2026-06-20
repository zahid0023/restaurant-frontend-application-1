"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, ChefHat, ImageIcon, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DishVariantGeneralInfo } from "./dish-variant-general-info";
import { DishVariantLocaleTranslations, type VariantLocaleFormRow } from "./dish-variant-locale-translations";
import { DishVariantIngredients } from "./dish-variant-ingredients";
import { dishesService } from "@/services/dishes";
import type { DishVariantDetail, DishVariantImage } from "@/services/dishes";
import { imageHostingConfigsService, type ImageHostingConfig } from "@/services/image-hosting-configs";
import { ImageHostingConfigDialog, emptyImageHostingConfigForm } from "@/components/image-hosting/image-hosting-config-dialog";
import type { ImageHostingConfigFormState } from "@/components/image-hosting/types";
import type { Locale } from "@/services/locales";
import type { Unit } from "@/services/units";
import type { IngredientRow } from "./ingredients-table";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateForm {
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_veg: boolean;
  locales: VariantLocaleFormRow[];
  ingredients: IngredientRow[];
}

interface ImageFileMeta {
  file: File;
  preview: string;
  caption: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DishVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "view";
  dishId: number;
  variant?: DishVariantDetail;
  availableLocales: Locale[];
  unitsByTypeId: Record<number, Unit[]>;
  onUnitTypeLoad?: (unitTypeId: number, units: Unit[]) => void;
  onSaved?: () => void | Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DishVariantDialog({
  open,
  onOpenChange,
  mode,
  dishId,
  variant,
  availableLocales,
  unitsByTypeId,
  onUnitTypeLoad,
  onSaved,
}: DishVariantDialogProps) {
  const { t } = useTranslation();

  // ── Step ───────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Create-mode form state ──────────────────────────────────────────────────
  const randomCode = () =>
    Math.random().toString(36).slice(2, 10).toUpperCase();

  const [form, setForm] = useState<CreateForm>({
    code: randomCode(),
    sort_order: 1,
    price: 0,
    is_default: false,
    is_veg: false,
    locales: [],
    ingredients: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // ── Image upload state (step 3, both modes) ────────────────────────────────
  const [imageFileMetas, setImageFileMetas] = useState<ImageFileMeta[]>([]);
  const [imageConfigId, setImageConfigId] = useState<string>("");
  const [imageConfigs, setImageConfigs] = useState<ImageHostingConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // ── Image hosting config dialog ────────────────────────────────────────────
  const [hostingDialogOpen, setHostingDialogOpen] = useState(false);
  const [hostingConfigForm, setHostingConfigForm] = useState<ImageHostingConfigFormState>(emptyImageHostingConfigForm);

  // ── View-mode gallery state (step 3) ───────────────────────────────────────
  const [variantImages, setVariantImages] = useState<DishVariantImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [editImageState, setEditImageState] = useState<{ caption: string; sort_order: string }>({ caption: "", sort_order: "0" });
  const [savingImage, setSavingImage] = useState(false);
  const [deleteImageTarget, setDeleteImageTarget] = useState<DishVariantImage | null>(null);

  // ── Reset on close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm({ code: randomCode(), sort_order: 1, price: 0, is_default: false, is_veg: false, locales: [], ingredients: [] });
      setSubmitting(false);
      setConfirmClose(false);
      setImageFileMetas((prev) => {
        prev.forEach((m) => URL.revokeObjectURL(m.preview));
        return [];
      });
      setImageConfigId("");
      setImageConfigs([]);
      setConfigsLoading(false);
      setUploadingImages(false);
      setVariantImages([]);
      setImagesLoaded(false);
      setImagesLoading(false);
      setEditingImageId(null);
      setSavingImage(false);
      setDeleteImageTarget(null);
      setHostingDialogOpen(false);
      setHostingConfigForm(emptyImageHostingConfigForm);
    }
  }, [open]);

  // ── Dirty check ────────────────────────────────────────────────────────────
  const isDirty =
    mode === "create"
      ? form.code.trim() !== "" || form.locales.length > 0 || form.ingredients.length > 0 || imageFileMetas.length > 0
      : false;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // ── Step 1 → 2 validation (create mode) ───────────────────────────────────
  function goToStep2() {
    if (!form.code.trim()) { toast.error(t("dish.errVariantCode", { n: 1 })); return; }
    if (form.locales.length === 0) { toast.error(t("dish.errAtLeastOneLocale")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("dish.errLocaleLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("dish.errLocaleName", { n: i + 1 })); return; }
    }
    setStep(2);
  }

  // ── Step 2 → 3 — load configs (both modes) + images (view mode) ──────────
  async function goToStep3() {
    setStep(3);
    const configsPromise = imageConfigs.length === 0 && !configsLoading
      ? (async () => {
          setConfigsLoading(true);
          try {
            const res = await imageHostingConfigsService.list({ size: 50, sort_by: "id" });
            setImageConfigs(res.data);
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setConfigsLoading(false);
          }
        })()
      : Promise.resolve();
    if (mode === "view" && variant?.id && !imagesLoaded) {
      await Promise.all([configsPromise, fetchVariantImages()]);
    } else {
      await configsPromise;
    }
  }

  async function fetchVariantImages() {
    if (!variant?.id) return;
    setImagesLoading(true);
    try {
      const res = await dishesService.listVariantImages(dishId, variant.id);
      setVariantImages(res.data ?? []);
      setImagesLoaded(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImagesLoading(false);
    }
  }

  // ── View-mode image edit/delete/upload handlers ─────────────────────────────
  function startEditImage(img: DishVariantImage) {
    setEditingImageId(img.id);
    setEditImageState({ caption: img.caption ?? "", sort_order: String(img.sort_order) });
  }

  async function saveImageEdit() {
    if (!variant?.id || editingImageId === null) return;
    setSavingImage(true);
    try {
      await dishesService.updateVariantImage(dishId, variant.id, editingImageId, {
        caption: editImageState.caption || undefined,
        sort_order: parseInt(editImageState.sort_order) || 0,
      });
      toast.success(t("common.saved"));
      setVariantImages((prev) =>
        prev.map((img) =>
          img.id === editingImageId
            ? { ...img, caption: editImageState.caption || undefined, sort_order: parseInt(editImageState.sort_order) || 0 }
            : img
        )
      );
      setEditingImageId(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingImage(false);
    }
  }

  async function confirmDeleteImage() {
    if (!variant?.id || !deleteImageTarget) return;
    try {
      await dishesService.deleteVariantImage(dishId, variant.id, deleteImageTarget.id);
      toast.success(t("restaurantImages.deletedToast"));
      setVariantImages((prev) => prev.filter((img) => img.id !== deleteImageTarget.id));
      setDeleteImageTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function uploadMoreImages() {
    if (!variant?.id) return;
    if (!imageConfigId) { toast.error(t("dish.variantImagesErrNoConfig")); return; }
    if (imageFileMetas.length === 0) { toast.error(t("restaurantImages.errNoFiles")); return; }
    setUploadingImages(true);
    try {
      await dishesService.uploadVariantImages(
        dishId,
        variant.id,
        Number(imageConfigId),
        imageFileMetas.map((m) => m.file),
        imageFileMetas.map((m, i) => ({
          client_image_id: m.file.name,
          caption: m.caption || undefined,
          sort_order: i + 1,
        })),
      );
      toast.success(t("restaurantImages.uploadedToast"));
      setImageFileMetas((prev) => { prev.forEach((m) => URL.revokeObjectURL(m.preview)); return []; });
      setImagesLoaded(false);
      await fetchVariantImages();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingImages(false);
    }
  }

  // ── New hosting config saved ───────────────────────────────────────────────
  async function handleNewHostingConfigSaved() {
    const prevIds = new Set(imageConfigs.map((c) => c.id));
    setConfigsLoading(true);
    try {
      const res = await imageHostingConfigsService.list({ size: 50, sort_by: "id" });
      setImageConfigs(res.data);
      const newConfig = res.data.find((c) => !prevIds.has(c.id));
      if (newConfig) setImageConfigId(String(newConfig.id));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setConfigsLoading(false);
    }
  }

  // ── Image file handlers ─────────────────────────────────────────────────────
  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImageFileMetas((prev) => {
      const existingNames = new Set(prev.map((m) => m.file.name));
      const newMetas = files
        .filter((f) => !existingNames.has(f.name))
        .map((file) => ({ file, preview: URL.createObjectURL(file), caption: "" }));
      return [...prev, ...newMetas];
    });
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  }

  function removeImageFile(idx: number) {
    setImageFileMetas((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function updateImageCaption(idx: number, caption: string) {
    setImageFileMetas((prev) => prev.map((m, i) => (i === idx ? { ...m, caption } : m)));
  }

  // ── Submit (create mode) ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    for (const [i, ing] of form.ingredients.entries()) {
      if (!ing.item_id) { toast.error(t("dish.errIngredientItem", { n: 1, m: i + 1 })); return; }
      if (!ing.unit_id) { toast.error(t("dish.errIngredientUnit", { n: 1, m: i + 1 })); return; }
      if (!ing.quantity || ing.quantity <= 0) { toast.error(t("dish.errIngredientQty", { n: 1, m: i + 1 })); return; }
    }
    if (imageFileMetas.length > 0 && !imageConfigId) {
      toast.error(t("dish.variantImagesErrNoConfig"));
      return;
    }
    setSubmitting(true);
    try {
      const variantData = {
        code: form.code.trim().toUpperCase(),
        sort_order: Number(form.sort_order) || 0,
        price: Number(form.price) || 0,
        is_default: form.is_default,
        is_veg: form.is_veg,
        locales: form.locales.map((r) => ({
          locale_id: Number(r.locale_id),
          name: r.name.trim(),
          description: r.description?.trim() || undefined,
          sort_order: Number(r.sort_order) || 0,
        })),
        ingredients: form.ingredients.map((ing, i) => ({
          item_id: Number(ing.item_id),
          quantity: Number(ing.quantity),
          unit_id: Number(ing.unit_id),
          sort_order: Number(ing.sort_order) || i + 1,
        })),
      };
      if (imageFileMetas.length > 0) {
        await dishesService.addVariantWithImages(
          dishId,
          variantData,
          Number(imageConfigId),
          imageFileMetas.map((m) => m.file),
          imageFileMetas.map((m, i) => ({
            client_image_id: m.file.name,
            caption: m.caption || undefined,
            sort_order: i + 1,
          })),
        );
      } else {
        await dishesService.addVariant(dishId, variantData);
      }
      toast.success(t("dish.variantCreated"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Step indicator ────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: t("dish.variantStepDetails") },
    { n: 2, label: t("dish.variantStepIngredients") },
    { n: 3, label: t("dish.variantStepImages") },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            {/* HEADER */}
            <DialogEntityHeader
              icon={<ChefHat className="h-4 w-4" />}
              title={mode === "create" ? t("dish.variantTitleCreate") : t("dish.variantTitleView")}
              description={mode === "create" ? t("dish.variantDescCreate") : t("dish.variantDescView")}
            />

            {/* STEP INDICATOR */}
            <div className="shrink-0 flex items-center gap-0 border-b bg-muted/20">
              {steps.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    if (mode === "create" && s.n === 2) { goToStep2(); return; }
                    if (s.n === 3) { goToStep3(); return; }
                    setStep(s.n);
                  }}
                  className={[
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors",
                    step === s.n
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground border-b-2 border-transparent",
                  ].join(" ")}
                >
                  <span className={[
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    step === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  ].join(" ")}>
                    {s.n}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Hidden file input — always mounted so ref is valid in both modes */}
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageFileSelect}
              />

              {/* ══ STEP 1: General Info + Translations ══ */}
              {step === 1 && (
                <>
                  <DishVariantGeneralInfo
                    key={`general-${variant?.id ?? "new"}-${open}`}
                    mode={mode}
                    dishId={dishId}
                    variantId={variant?.id}
                    code={mode === "create" ? form.code : (variant?.code ?? "")}
                    sortOrder={mode === "create" ? form.sort_order : (variant?.sort_order ?? 1)}
                    price={mode === "create" ? form.price : (variant?.price ?? 0)}
                    isDefault={mode === "create" ? form.is_default : (variant?.is_default ?? false)}
                    isVeg={mode === "create" ? form.is_veg : (variant?.is_veg ?? false)}
                    onCodeChange={(v) => setForm((prev) => ({ ...prev, code: v }))}
                    onSortOrderChange={(v) => setForm((prev) => ({ ...prev, sort_order: v }))}
                    onPriceChange={(v) => setForm((prev) => ({ ...prev, price: v }))}
                    onIsDefaultChange={(v) => setForm((prev) => ({ ...prev, is_default: v }))}
                    onIsVegChange={(v) => setForm((prev) => ({ ...prev, is_veg: v }))}
                    onSaved={onSaved}
                  />

                  <DishVariantLocaleTranslations
                    key={`locales-${variant?.id ?? "new"}-${open}`}
                    mode={mode}
                    dishId={dishId}
                    variantId={variant?.id}
                    locales={mode === "create" ? form.locales : undefined}
                    onLocalesChange={(rows) => setForm((prev) => ({ ...prev, locales: rows }))}
                    savedLocales={mode === "view" ? (variant?.locales ?? []) : undefined}
                    availableLocales={availableLocales}
                    onSaved={onSaved}
                  />
                </>
              )}

              {/* ══ STEP 2: Ingredients ══ */}
              {step === 2 && (
                <DishVariantIngredients
                  key={`ingredients-${variant?.id ?? "new"}-${open}`}
                  mode={mode}
                  dishId={dishId}
                  variantId={variant?.id}
                  rows={mode === "create" ? form.ingredients : undefined}
                  onRowsChange={(rows) => setForm((prev) => ({ ...prev, ingredients: rows }))}
                  ingredientDetails={mode === "view" ? (variant?.ingredients ?? []) : undefined}
                  unitsByTypeId={unitsByTypeId}
                  onUnitTypeLoad={onUnitTypeLoad}
                  onSaved={onSaved}
                />
              )}

              {/* ══ STEP 3: Images — view mode gallery ══ */}
              {step === 3 && mode === "view" && (
                <div className="space-y-5">
                  {/* Gallery */}
                  {imagesLoading ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">{t("restaurantImages.loading")}</p>
                  ) : variantImages.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg py-10 text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t("dish.variantNoImages")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {variantImages.map((img) => (
                        <Card key={img.id} className="overflow-hidden gap-0 py-0">
                          <div className="relative aspect-video bg-muted overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.caption ?? ""} className="object-cover w-full h-full" />
                          </div>
                          <CardContent className="px-3 py-3 space-y-2">
                            {editingImageId === img.id ? (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-xs">{t("restaurantImages.caption")}</Label>
                                  <Input
                                    className="h-7 text-xs"
                                    value={editImageState.caption}
                                    onChange={(e) => setEditImageState((s) => ({ ...s, caption: e.target.value }))}
                                    placeholder={t("restaurantImages.captionPlaceholder")}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">{t("restaurantImages.sortOrder")}</Label>
                                  <Input
                                    className="h-7 text-xs"
                                    type="number"
                                    value={editImageState.sort_order}
                                    onChange={(e) => setEditImageState((s) => ({ ...s, sort_order: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-1 pt-1">
                                  <Button type="button" size="sm" className="h-7 text-xs flex-1" disabled={savingImage} onClick={saveImageEdit}>
                                    <Check className="h-3 w-3 mr-1" /> {t("common.save")}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingImageId(null)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-xs truncate text-muted-foreground min-h-[1rem]">
                                  {img.caption || <span className="italic opacity-50">{t("restaurantImages.noCaption")}</span>}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">#{img.sort_order}</Badge>
                                  <div className="flex gap-1">
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditImage(img)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteImageTarget(img)}>
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
                  )}

                  {/* Upload more */}
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium">{t("dish.variantUploadMore")}</p>
                    <Card>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t("restaurantImages.hostingConfig")}</Label>
                          {configsLoading ? (
                            <p className="text-sm text-muted-foreground">{t("dish.variantImagesLoadingConfigs")}</p>
                          ) : imageConfigs.length === 0 ? (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground flex-1">{t("dish.variantImagesNoConfigs")}</p>
                              <Button type="button" size="sm" variant="outline" onClick={() => { setHostingConfigForm(emptyImageHostingConfigForm); setHostingDialogOpen(true); }}>
                                <Plus className="h-3.5 w-3.5 mr-1" /> {t("imageHosting.new")}
                              </Button>
                            </div>
                          ) : (
                            <Select value={imageConfigId} onValueChange={setImageConfigId}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t("restaurantImages.selectConfig")} />
                              </SelectTrigger>
                              <SelectContent>
                                {imageConfigs.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}{" "}
                                    <span className="text-muted-foreground text-xs ml-1">({c.provider})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-lg py-6 text-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    >
                      <ImageIcon className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                      <p className="text-sm">{t("restaurantImages.dropOrClick")}</p>
                      <p className="text-xs mt-0.5 opacity-60">{t("restaurantImages.imageFormats")}</p>
                    </button>
                    {imageFileMetas.length > 0 && (
                      <div className="space-y-2">
                        {imageFileMetas.map((meta, idx) => (
                          <Card key={idx} className="overflow-hidden gap-0 py-0">
                            <div className="flex gap-3 p-3">
                              <div className="h-14 w-20 rounded bg-muted overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={meta.preview} alt="" className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <p className="text-xs font-medium truncate text-muted-foreground">{meta.file.name}</p>
                                <Input
                                  className="h-7 text-xs"
                                  placeholder={t("restaurantImages.captionPlaceholder")}
                                  value={meta.caption}
                                  onChange={(e) => updateImageCaption(idx, e.target.value)}
                                />
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeImageFile(idx)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={uploadingImages}
                          onClick={uploadMoreImages}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingImages ? t("restaurantImages.uploading") : t("restaurantImages.uploadBtn", { count: imageFileMetas.length })}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ STEP 3: Images (create mode only) ══ */}
              {step === 3 && mode === "create" && (
                <div className="space-y-4">
                  {/* Optional note */}
                  <p className="text-sm text-muted-foreground">{t("dish.variantImagesOptional")}</p>

                  {/* Config select */}
                  <Card>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t("restaurantImages.hostingConfig")}</Label>
                        {configsLoading ? (
                          <p className="text-sm text-muted-foreground">{t("dish.variantImagesLoadingConfigs")}</p>
                        ) : imageConfigs.length === 0 ? (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground flex-1">{t("dish.variantImagesNoConfigs")}</p>
                            <Button type="button" size="sm" variant="outline" onClick={() => { setHostingConfigForm(emptyImageHostingConfigForm); setHostingDialogOpen(true); }}>
                              <Plus className="h-3.5 w-3.5 mr-1" /> {t("imageHosting.new")}
                            </Button>
                          </div>
                        ) : (
                          <Select value={imageConfigId} onValueChange={setImageConfigId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("restaurantImages.selectConfig")} />
                            </SelectTrigger>
                            <SelectContent>
                              {imageConfigs.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}{" "}
                                  <span className="text-muted-foreground text-xs ml-1">({c.provider})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Drop zone */}
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-lg py-8 text-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t("restaurantImages.dropOrClick")}</p>
                    <p className="text-xs mt-1 opacity-60">{t("restaurantImages.imageFormats")}</p>
                  </button>

                  {/* File list */}
                  {imageFileMetas.length > 0 && (
                    <div className="space-y-3">
                      {imageFileMetas.map((meta, idx) => (
                        <Card key={idx} className="overflow-hidden gap-0 py-0">
                          <div className="flex gap-3 p-3">
                            <div className="h-16 w-24 rounded bg-muted overflow-hidden shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={meta.preview} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <p className="text-xs font-medium truncate text-muted-foreground">{meta.file.name}</p>
                              <Input
                                className="h-7 text-xs"
                                placeholder={t("restaurantImages.captionPlaceholder")}
                                value={meta.caption}
                                onChange={(e) => updateImageCaption(idx, e.target.value)}
                              />
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                              onClick={() => removeImageFile(idx)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* FOOTER */}
            <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-between gap-2">
              {/* Left */}
              {step > 1 ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> {t("common.prev")}
                </Button>
              ) : (
                <Button type="button" size="sm" variant="ghost" onClick={requestClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
              )}

              {/* Right */}
              {mode === "create" && step === 1 && (
                <Button type="button" size="sm" onClick={goToStep2} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              {mode === "create" && step === 2 && (
                <Button type="button" size="sm" onClick={goToStep3} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              {mode === "create" && step === 3 && (
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {submitting ? t("common.saving") : t("common.create")}
                </Button>
              )}
              {mode === "view" && step < 3 && (
                <Button type="button" size="sm" variant="outline" onClick={step === 2 ? goToStep3 : () => setStep(2)} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete image */}
      <AlertDialog open={!!deleteImageTarget} onOpenChange={(o) => !o && setDeleteImageTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("restaurantImages.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("restaurantImages.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteImage}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New image hosting config */}
      <ImageHostingConfigDialog
        open={hostingDialogOpen}
        onOpenChange={setHostingDialogOpen}
        mode="create"
        form={hostingConfigForm}
        onFormChange={setHostingConfigForm}
        onSaved={handleNewHostingConfigSaved}
      />

      {/* Confirm close */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmClose(false); onOpenChange(false); }}>
              {t("dialog.discardChanges.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
