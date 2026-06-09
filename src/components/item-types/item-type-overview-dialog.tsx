"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, GitBranch, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory, ItemCategoryLocale } from "@/services/item-categories";
import type { ItemType } from "@/services/item-types";
import type { Locale } from "@/services/locales";
import { ItemCategoryCard } from "@/components/item-categories/item-category-card";
import { CategoryOverviewDialog } from "@/components/item-categories/category-overview-dialog";
import {
  ItemCategoryDialog,
  emptyItemCategoryForm,
} from "@/components/item-categories/item-category-dialog";
import type { ItemCategoryDialogMode, ItemCategoryFormState } from "@/components/item-categories/types";

export interface ItemTypeOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: ItemType | null;
  itemTypeName?: string;
  availableLocales: Locale[];
}

export function ItemTypeOverviewDialog({
  open,
  onOpenChange,
  itemType,
  itemTypeName,
  availableLocales,
}: ItemTypeOverviewDialogProps) {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryLocaleRows, setCategoryLocaleRows] = useState<Record<number, ItemCategoryLocale[]>>({});
  const [loading, setLoading] = useState(false);

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catMode, setCatMode] = useState<ItemCategoryDialogMode>("create");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [catForm, setCatForm] = useState<ItemCategoryFormState>(emptyItemCategoryForm);

  // Overview + delete state
  const [overviewCat, setOverviewCat] = useState<ItemCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemCategory | null>(null);

  const itemTypeId = itemType?.id ?? 0;

  useEffect(() => {
    if (!open || !itemType) {
      setCategories([]);
      setCategoryLocaleRows({});
      return;
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemType?.id]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await itemCategoriesService.list({ size: 50, sort_by: "sortOrder" });
      setCategories(res.data);
      const entries = res.data.map((cat) => [cat.id, cat.locales ?? []] as const);
      setCategoryLocaleRows(Object.fromEntries(entries));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const categoryNames: Record<number, string> = {};
  for (const [id, rows] of Object.entries(categoryLocaleRows)) {
    categoryNames[Number(id)] = rows[0]?.name ?? "";
  }

  const roots = categories.filter((c) => c.parent_id == null);
  const childrenOf: Record<number, ItemCategory[]> = {};
  for (const cat of categories) {
    if (cat.parent_id != null) {
      if (!childrenOf[cat.parent_id]) childrenOf[cat.parent_id] = [];
      childrenOf[cat.parent_id].push(cat);
    }
  }

  function openCreateCat(parentId?: number) {
    setCatMode("create");
    setActiveCatId(undefined);
    setCatForm({ ...emptyItemCategoryForm, parent_id: parentId ?? null });
    setCatDialogOpen(true);
  }

  async function openCatDetail(cat: ItemCategory, mode: "edit" | "view") {
    setCatMode(mode);
    setActiveCatId(cat.id);
    setCatForm({ parent_id: cat.parent_id ?? null, code: cat.code, sort_order: cat.sort_order, locales: [] });
    setCatDialogOpen(true);
    setCatForm((prev) => ({
      ...prev,
      locales: (cat.locales ?? []).map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    }));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await itemCategoriesService.remove(deleteTarget.id);
      toast.success(`${t("itemCategory.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!itemType) return null;

  const name = itemTypeName?.trim() || itemType.code;
  const initials = itemType.code.slice(0, 3).toUpperCase();

  const cardProps = (cat: ItemCategory) => ({
    category: cat,
    defaultName: categoryNames[cat.id],
    subCount: (childrenOf[cat.id] ?? []).length,
    onOverview: (c: ItemCategory) => setOverviewCat(c),
    onView: (c: ItemCategory) => openCatDetail(c, "view"),
    onEdit: (c: ItemCategory) => openCatDetail(c, "edit"),
    onDelete: (c: ItemCategory) => setDeleteTarget(c),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">

          {/* Hero header */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-6 pb-5 shrink-0">
            <div className="relative flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold leading-tight">{name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                    {itemType.code}
                  </span>
                  <Badge variant="secondary" className="text-xs">#{itemType.sort_order}</Badge>
                  <Badge
                    variant={itemType.is_consumable ? "default" : "outline"}
                    className="text-xs"
                  >
                    {itemType.is_consumable ? t("itemType.consumable") : t("itemType.nonConsumable")}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => openCreateCat()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t("itemCategory.newCategory")}
              </Button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">{t("itemCategory.pageTitle")}</h3>
              {!loading && categories.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                  {roots.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : roots.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                <GitBranch className="h-8 w-8 opacity-25" />
                <p className="text-sm">{t("itemCategory.emptyDesc")}</p>
                <Button variant="outline" size="sm" onClick={() => openCreateCat()}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("itemCategory.newCategory")}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {roots.map((root) => {
                  const children = childrenOf[root.id] ?? [];
                  return (
                    <div key={root.id} className="space-y-3">
                      <ItemCategoryCard {...cardProps(root)} />
                      {children.length > 0 && (
                        <div className="pl-6 border-l-2 border-border ml-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {children.map((child) => (
                              <ItemCategoryCard
                                key={child.id}
                                {...cardProps(child)}
                                parentCode={root.code}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Category CRUD dialog */}
      <ItemCategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        mode={catMode}
        categoryId={activeCatId}
        form={catForm}
        onFormChange={setCatForm}
        availableLocales={availableLocales}
        availableParents={roots}
        onSaved={fetchCategories}
      />

      {/* Category overview dialog */}
      <CategoryOverviewDialog
        open={!!overviewCat}
        onOpenChange={(o) => !o && setOverviewCat(null)}
        category={overviewCat}
        categoryName={overviewCat ? categoryNames[overviewCat.id] : undefined}
        categoryDescription={overviewCat ? (categoryLocaleRows[overviewCat.id]?.[0]?.description ?? undefined) : undefined}
        availableLocales={availableLocales}
        onEdit={(c) => openCatDetail(c, "edit")}
        onDelete={(c) => setDeleteTarget(c)}
        onAddSubcategory={() => overviewCat && openCreateCat(overviewCat.id)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("itemCategory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("itemCategory.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
