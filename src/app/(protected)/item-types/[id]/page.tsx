
"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, X, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ItemCategoryCard } from "@/components/item-categories/item-category-card";
import { CategoryOverviewDialog } from "@/components/item-categories/category-overview-dialog";
import {
  ItemCategoryDialog,
  emptyItemCategoryForm,
} from "@/components/item-categories/item-category-dialog";
import type { ItemCategoryDialogMode, ItemCategoryFormState } from "@/components/item-categories/types";
import { ItemTypeDialog, emptyItemTypeForm } from "@/components/item-types/item-type-dialog";
import type { ItemTypeDialogMode, ItemTypeFormState } from "@/components/item-types/types";
import { itemTypesService } from "@/services/item-types";
import type { ItemType, ItemTypeLocale } from "@/services/item-types";
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory, ItemCategoryLocale } from "@/services/item-categories";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name";

export default function ItemTypeDetailPage({
  params,
}: {

  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const itemTypeId = Number(idStr);

  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("common.allFields"),
    code: t("common.code"),
    name: t("common.localizedName"),
  };

  // Item type state
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [itemTypeLocales, setItemTypeLocales] = useState<ItemTypeLocale[]>([]);

  // Categories state — holds ALL categories (flat); only roots are displayed on this page
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryLocaleRows, setCategoryLocaleRows] = useState<Record<number, ItemCategoryLocale[]>>({});
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  // Item type edit dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeDialogMode, setTypeDialogMode] = useState<ItemTypeDialogMode>("edit");
  const [typeForm, setTypeForm] = useState<ItemTypeFormState>(emptyItemTypeForm);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catMode, setCatMode] = useState<ItemCategoryDialogMode>("create");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [catForm, setCatForm] = useState<ItemCategoryFormState>(emptyItemCategoryForm);

  const [deleteTarget, setDeleteTarget] = useState<ItemCategory | null>(null);
  const [overviewTarget, setOverviewTarget] = useState<ItemCategory | null>(null);

  async function refreshItemType() {
    try {
      const res = await itemTypesService.get(itemTypeId);
      setItemType(res.item_type);
      const locRes = await itemTypesService.listLocales(itemTypeId, { size: 50 });
      setItemTypeLocales(locRes.data);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function refreshCategories() {
    setLoading(true);
    try {
      const res = await itemCategoriesService.listRoot(itemTypeId, { size: 50, sort_by: "sortOrder" });
      setCategories(res.data);
      // Only fetch locales for root categories — subcategory locales are loaded lazily in the overview dialog
      const roots = res.data.filter((c) => c.parent_id == null);
      const entries = await Promise.all(
        roots.map(async (cat) => {
          try {
            const loc = await itemCategoriesService.listLocales(itemTypeId, cat.id, {
              size: 50,
              sort_by: "sortOrder",
            });
            return [cat.id, loc.data] as const;
          } catch {
            return [cat.id, [] as ItemCategoryLocale[]] as const;
          }
        }),
      );
      setCategoryLocaleRows(Object.fromEntries(entries));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!itemTypeId) return;
    refreshItemType();
    refreshCategories();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemTypeId]);

  const categoryNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const [id, rows] of Object.entries(categoryLocaleRows)) {
      out[Number(id)] = rows[0]?.name ?? "";
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryLocaleRows, locale]);

  // Map category id → code for parent display
  const categoryCodeMap = useMemo(() => {
    const out: Record<number, string> = {};
    for (const cat of categories) out[cat.id] = cat.code;
    return out;
  }, [categories]);

  // Only top-level categories as available parents (single-level hierarchy)
  const availableParents = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  );

  const filtered = useMemo(() => {
    // Only display root categories on this page; subcategories are shown in the overview dialog
    const roots = categories.filter((c) => c.parent_id == null);
    const q = search.trim().toLowerCase();
    if (!q) return roots;
    return roots.filter((cat) => {
      const code = cat.code.toLowerCase();
      const name = (categoryNames[cat.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        default: return code.includes(q) || name.includes(q);
      }
    });
  }, [categories, categoryNames, search, searchField]);

  // Item type edit
  async function openTypeEdit() {
    if (!itemType) return;
    setTypeDialogMode("edit");
    setTypeForm({ code: itemType.code, is_consumable: itemType.is_consumable, sort_order: itemType.sort_order, locales: [] });
    setTypeDialogOpen(true);
    try {
      const locRes = await itemTypesService.listLocales(itemTypeId, { size: 50 });
      setTypeForm((prev) => ({
        ...prev,
        locales: locRes.data.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      }));
    } catch {
      /* non-blocking */
    }
  }

  // Category CRUD
  function openCreateCat(parentId?: number) {
    setCatMode("create");
    setActiveCatId(undefined);
    setCatForm({ ...emptyItemCategoryForm, parent_id: parentId ?? null });
    setCatDialogOpen(true);
  }

  async function openCatDetail(cat: ItemCategory, nextMode: "edit" | "view") {
    setCatMode(nextMode);
    setActiveCatId(cat.id);
    setCatForm({ parent_id: cat.parent_id ?? null, code: cat.code, sort_order: cat.sort_order, locales: [] });
    setCatDialogOpen(true);
    try {
      const res = await itemCategoriesService.listLocales(itemTypeId, cat.id, { size: 50 });
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
    } catch {
      /* non-blocking */
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await itemCategoriesService.remove(itemTypeId, deleteTarget.id);
      toast.success(`${t("itemCategory.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refreshCategories();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const itemTypeName = itemTypeLocales[0]?.name ?? itemType?.code ?? "";
  const itemTypeDisplayName = itemTypeName || (itemType?.code ?? `#${itemTypeId}`);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back + header */}
      <div className="space-y-4">
        <Link
          href="/item-types"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("itemType.backToTypes")}
        </Link>

        {itemType ? (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
              <h1 className="text-3xl font-semibold tracking-tight">{itemTypeDisplayName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground font-mono">{itemType.code}</span>
                <Badge variant={itemType.is_consumable ? "default" : "outline"} className="text-xs">
                  {itemType.is_consumable ? t("itemType.consumable") : t("itemType.nonConsumable")}
                </Badge>
                <Badge variant="secondary" className="text-xs">#{itemType.sort_order}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={openTypeEdit}>
              <Pencil className="h-4 w-4 mr-1.5" /> {t("itemType.editType")}
            </Button>
          </div>
        ) : (
          <div className="h-14 animate-pulse bg-muted rounded-lg" />
        )}
      </div>

      {/* Categories section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("itemCategory.pageTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("itemCategory.pageSubtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-stretch">
              <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
                <SelectTrigger className="w-36 h-10 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allFields")}</SelectItem>
                  <SelectItem value="code">{t("common.code")}</SelectItem>
                  <SelectItem value="name">{t("common.localizedName")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${t("common.search")} ${searchFieldLabels[searchField].toLowerCase()}…`}
                  className="pl-9 pr-9 w-56 h-10 rounded-l-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <Button onClick={openCreateCat}>
              <Plus className="h-4 w-4 mr-1.5" /> {t("itemCategory.newCategory")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("itemCategory.pageTitle")}…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {search ? t("itemCategory.emptyTitle") : t("itemCategory.emptyDesc")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <ItemCategoryCard
                key={cat.id}
                category={cat}
                defaultName={categoryNames[cat.id]}
                parentCode={cat.parent_id != null ? categoryCodeMap[cat.parent_id] : undefined}
                subCount={categories.filter((c) => c.parent_id === cat.id).length}
                onOverview={(c) => setOverviewTarget(c)}
                onEdit={(c) => openCatDetail(c, "edit")}
                onDelete={(c) => setDeleteTarget(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item type edit dialog */}
      <ItemTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        mode={typeDialogMode}
        onModeChange={setTypeDialogMode}
        typeId={itemTypeId}
        form={typeForm}
        onFormChange={setTypeForm}
        availableLocales={availableLocales}
        onSaved={refreshItemType}
      />

      {/* Category dialog */}
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
        availableParents={availableParents}
        onSaved={refreshCategories}
      />

      {/* Category overview dialog — self-fetches subcategory data on open */}
      <CategoryOverviewDialog
        open={!!overviewTarget}
        onOpenChange={(o) => !o && setOverviewTarget(null)}
        itemTypeId={itemTypeId}
        category={overviewTarget}
        categoryName={overviewTarget ? categoryNames[overviewTarget.id] : undefined}
        categoryDescription={overviewTarget ? (categoryLocaleRows[overviewTarget.id]?.[0]?.description ?? undefined) : undefined}
        availableLocales={availableLocales}
        onEdit={(c) => openCatDetail(c, "edit")}
        onDelete={(c) => setDeleteTarget(c)}
        onAddSubcategory={() => overviewTarget && openCreateCat(overviewTarget.id)}
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
    </div>
  );
}
