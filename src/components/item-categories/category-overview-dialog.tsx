import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, FolderOpen, Tag, GitBranch, X, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { Locale } from "@/services/locales";
import { ItemCategoryCard } from "@/components/item-categories/item-category-card";
import {
  ItemCategoryDialog,
  emptyItemCategoryForm,
} from "@/components/item-categories/item-category-dialog";
import type { ItemCategoryDialogMode, ItemCategoryFormState } from "@/components/item-categories/types";

export interface CategoryOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTypeId: number;
  category: ItemCategory | null;
  categoryName?: string;
  categoryDescription?: string;
  availableLocales: Locale[];
  onEdit: (cat: ItemCategory) => void;
  onDelete: (cat: ItemCategory) => void;
  onAddSubcategory: () => void;
}

type NavEntry = { cat: ItemCategory; name?: string; description?: string };

export function CategoryOverviewDialog({
  open,
  onOpenChange,
  itemTypeId,
  category,
  categoryName,
  categoryDescription,
  availableLocales,
  onEdit,
  onDelete,
  onAddSubcategory,
}: CategoryOverviewDialogProps) {
  const { t } = useTranslation();

  // Navigation stack — each entry is a category level the user has drilled into
  const [navStack, setNavStack] = useState<NavEntry[]>([]);
  const [subcategories, setSubcategories] = useState<ItemCategory[]>([]);
  const [subLocaleRows, setSubLocaleRows] = useState<Record<number, ItemCategoryLocale[]>>({});
  const [loading, setLoading] = useState(false);

  // CRUD dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catMode, setCatMode] = useState<ItemCategoryDialogMode>("view");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [catForm, setCatForm] = useState<ItemCategoryFormState>(emptyItemCategoryForm);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ItemCategory | null>(null);

  // Reset stack when panel opens or root category changes
  useEffect(() => {
    if (!open || !category) {
      setNavStack([]);
      setSubcategories([]);
      setSubLocaleRows({});
      return;
    }
    setNavStack([{ cat: category, name: categoryName, description: categoryDescription }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id]);

  const current = navStack[navStack.length - 1] ?? null;

  // Fetch subcategories whenever we navigate to a new level
  useEffect(() => {
    if (!current) return;
    fetchSubcategories(current.cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.cat.id]);

  async function fetchSubcategories(cat: ItemCategory) {
    setLoading(true);
    setSubcategories([]);
    setSubLocaleRows({});
    try {
      const res = await itemCategoriesService.listSubcategories(itemTypeId, cat.id);
      const subs = res.data;
      setSubcategories(subs);
      const localeEntries = await Promise.all(
        subs.map(async (sub) => {
          try {
            const loc = await itemCategoriesService.listLocales(itemTypeId, sub.id, { size: 50, sort_by: "sortOrder" });
            return [sub.id, loc.data] as const;
          } catch {
            return [sub.id, [] as ItemCategoryLocale[]] as const;
          }
        }),
      );
      setSubLocaleRows(Object.fromEntries(localeEntries));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  function navigateTo(sub: ItemCategory) {
    setNavStack((prev) => [...prev, { cat: sub, name: subNames[sub.id] }]);
  }

  function navigateToIndex(index: number) {
    setNavStack((prev) => prev.slice(0, index + 1));
  }

  async function openSubDetail(sub: ItemCategory, mode: ItemCategoryDialogMode) {
    setCatMode(mode);
    setActiveCatId(sub.id);
    setCatForm({ parent_id: sub.parent_id ?? null, code: sub.code, sort_order: sub.sort_order, locales: [] });
    setCatDialogOpen(true);
    try {
      const res = await itemCategoriesService.listLocales(itemTypeId, sub.id, { size: 50 });
      setCatForm((prev) => ({
        ...prev,
        locales: res.data.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      }));
    } catch { /* non-blocking */ }
  }

  function openAddSub() {
    if (!current) return;
    if (navStack.length === 1) {
      // Root level — delegate to parent so it can refresh the main list too
      onAddSubcategory();
    } else {
      // Deeper level — open create dialog inline
      setCatMode("create");
      setActiveCatId(undefined);
      setCatForm({ ...emptyItemCategoryForm, parent_id: current.cat.id });
      setCatDialogOpen(true);
    }
  }

  async function confirmDeleteSub() {
    if (!deleteTarget) return;
    try {
      await itemCategoriesService.remove(itemTypeId, deleteTarget.id);
      toast.success(`${t("itemCategory.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      if (current) await fetchSubcategories(current.cat);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const subNames: Record<number, string> = {};
  for (const [id, rows] of Object.entries(subLocaleRows)) {
    subNames[Number(id)] = rows[0]?.name ?? "";
  }

  if (!open || !current) return null;

  const { cat, description } = current;
  const displayName = current.name?.trim() || cat.code;
  const initials = cat.code.slice(0, 3).toUpperCase();
  const isRoot = navStack.length === 1;

  return (
    <>
      {/* Absolute overlay — covers exactly the <main> portal view area */}
      <div className="absolute inset-0 flex flex-col bg-background animate-in fade-in-0 slide-in-from-right-4 duration-200">

        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-5 pb-4 shrink-0">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-6xl mx-auto space-y-3">

            {/* Breadcrumb row */}
            <div className="flex items-center gap-1 min-w-0">
              {!isRoot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 mr-1"
                  aria-label="Back"
                  onClick={() => setNavStack((prev) => prev.slice(0, -1))}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {navStack.map((entry, i) => (
                <span key={entry.cat.id} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  {i < navStack.length - 1 ? (
                    <button
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[12rem]"
                      onClick={() => navigateToIndex(i)}
                    >
                      {entry.name?.trim() || entry.cat.code}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold truncate max-w-[16rem]">
                      {entry.name?.trim() || entry.cat.code}
                    </span>
                  )}
                </span>
              ))}
            </div>

            {/* Title + actions row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight truncate">{displayName}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                      {cat.code}
                    </span>
                    <Badge variant="secondary" className="text-xs">#{cat.sort_order}</Badge>
                    {isRoot && (
                      <Badge className="text-xs bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">
                        {t("itemCategory.topLevel")}
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10"
                  aria-label="Edit"
                  onClick={() => onEdit(cat)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete"
                  onClick={() => onDelete(cat)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* Subcategories section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">{t("itemCategory.subcategories")}</h3>
                  {!loading && subcategories.length > 0 && (
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                      {subcategories.length}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={openAddSub}
                >
                  <Plus className="h-3 w-3" />
                  {t("itemCategory.addSubcategory")}
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : subcategories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 border-2 border-dashed rounded-xl text-muted-foreground">
                  <GitBranch className="h-7 w-7 opacity-30" />
                  <p className="text-sm">{t("itemCategory.noSubcategories")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {subcategories.map((sub) => (
                    <ItemCategoryCard
                      key={sub.id}
                      category={sub}
                      defaultName={subNames[sub.id]}
                      parentCode={cat.code}
                      onOverview={(c) => navigateTo(c)}
                      onView={(c) => openSubDetail(c, "view")}
                      onEdit={(c) => openSubDetail(c, "edit")}
                      onDelete={(c) => setDeleteTarget(c)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Items section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{t("itemCategory.items")}</h3>
              </div>
              <div className="flex flex-col items-center gap-2.5 py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                <FolderOpen className="h-8 w-8 opacity-25" />
                <p className="text-sm">{t("itemCategory.noItems")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRUD dialog for subcategories */}
      <ItemCategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        mode={catMode}
        onModeChange={setCatMode}
        itemTypeId={itemTypeId}
        categoryId={activeCatId}
        form={catForm}
        onFormChange={setCatForm}
        availableLocales={availableLocales}
        availableParents={[]}
        onSaved={() => current && fetchSubcategories(current.cat)}
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
            <AlertDialogAction onClick={confirmDeleteSub}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
