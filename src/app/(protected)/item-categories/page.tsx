"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ItemCategoryDialog,
  emptyItemCategoryForm,
} from "@/components/item-categories/item-category-dialog";
import { CategoryOverviewDialog } from "@/components/item-categories/category-overview-dialog";
import type { ItemCategoryDialogMode, ItemCategoryFormState } from "@/components/item-categories/types";
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory } from "@/services/item-categories";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

type SearchField = "all" | "code" | "name";

export default function ItemCategoriesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catMode, setCatMode] = useState<ItemCategoryDialogMode>("create");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [catForm, setCatForm] = useState<ItemCategoryFormState>(emptyItemCategoryForm);

  const [overviewTarget, setOverviewTarget] = useState<ItemCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemCategory | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await itemCategoriesService.listRoot({ size: 50, sort_by: "sortOrder" });
      setCategories(res.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const cat of categories) out[cat.id] = cat.locales[0]?.name ?? "";
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, locale]);

  const availableParents = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => {
      const code = cat.code.toLowerCase();
      const name = (categoryNames[cat.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        default: return code.includes(q) || name.includes(q);
      }
    });
  }, [categories, categoryNames, search, searchField]);

  function openCreate(parentId?: number) {
    setCatMode("create");
    setActiveCatId(undefined);
    setCatForm({ ...emptyItemCategoryForm, parent_id: parentId ?? null });
    setCatDialogOpen(true);
  }

  function openCatDetail(cat: ItemCategory, nextMode: "edit" | "view") {
    setCatMode(nextMode);
    setActiveCatId(cat.id);
    setCatForm({
      parent_id: cat.parent_id ?? null,
      code: cat.code,
      sort_order: cat.sort_order,
      locales: cat.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setCatDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await itemCategoriesService.remove(deleteTarget.id);
      toast.success(`${t("itemCategory.deletedToast")} ${deleteTarget.code}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("itemCategory.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("itemCategory.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-stretch">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
              <SelectTrigger className="w-36 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
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
                placeholder={`${t("common.search")}…`}
                className="pl-9 pr-9 w-52 rounded-l-none"
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
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("itemCategory.newCategory")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("itemCategory.loading")}</div>
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
              subCount={0}
              onOverview={(c) => setOverviewTarget(c)}
              onView={(c) => openCatDetail(c, "view")}
              onEdit={(c) => openCatDetail(c, "edit")}
              onDelete={(c) => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      <ItemCategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        mode={catMode}
        categoryId={activeCatId}
        form={catForm}
        onFormChange={setCatForm}
        availableLocales={availableLocales}
        availableParents={availableParents}
        onSaved={refresh}
      />

      <CategoryOverviewDialog
        open={!!overviewTarget}
        onOpenChange={(o) => !o && setOverviewTarget(null)}
        category={overviewTarget}
        categoryName={overviewTarget ? categoryNames[overviewTarget.id] : undefined}
        categoryDescription={overviewTarget ? (overviewTarget.locales[0]?.description ?? undefined) : undefined}
        availableLocales={availableLocales}
        onEdit={(c) => openCatDetail(c, "edit")}
        onDelete={(c) => setDeleteTarget(c)}
        onAddSubcategory={() => overviewTarget && openCreate(overviewTarget.id)}
      />

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
