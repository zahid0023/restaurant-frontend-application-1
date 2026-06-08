"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ItemCard } from "@/components/items/item-card";
import { ItemDialog, emptyItemForm } from "@/components/items/item-dialog";
import { AssignCategoriesDialog } from "@/components/items/assign-categories-dialog";
import type { ItemDialogMode, ItemFormState } from "@/components/items/types";
import { itemsService } from "@/services/items";
import type { ItemSummary } from "@/services/items";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name";

export default function ItemsPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState<ItemSummary[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ItemDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ItemFormState>(emptyItemForm);

  const [deleteTarget, setDeleteTarget] = useState<ItemSummary | null>(null);
  const [assignTarget, setAssignTarget] = useState<ItemSummary | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await itemsService.list({ size: 50, sort_by: "sortOrder" });
      setItems(res.data);
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

  const itemNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const item of items) {
      out[item.id] = item.locales[0]?.name ?? "";
    }
    return out;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const code = item.code.toLowerCase();
      const name = (itemNames[item.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        default: return code.includes(q) || name.includes(q);
      }
    });
  }, [items, itemNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyItemForm);
    setDialogOpen(true);
  }

  async function openDetail(item: ItemSummary) {
    setMode("view");
    setActiveId(item.id);
    setForm({
      code: item.code,
      item_type_id: "",
      unit_type_id: "",
      sort_order: item.sort_order,
      locales: [],
    });
    setDialogOpen(true);
    try {
      const res = await itemsService.get(item.id);
      const full = res.item;
      setForm((prev) => ({
        ...prev,
        locales: full.locales.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      }));
    } catch { /* non-blocking */ }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await itemsService.remove(deleteTarget.id);
      toast.success(`${t("item.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("common.allFields"),
    code: t("common.code"),
    name: t("common.localizedName"),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("item.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("item.pageSubtitle")}</p>
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
                placeholder={`${t("common.search")} ${searchFieldLabels[searchField].toLowerCase()}…`}
                className="pl-9 pr-9 w-64 rounded-l-none"
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
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("item.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("item.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("item.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              defaultName={itemNames[item.id]}
              onView={(i) => openDetail(i)}
              onDelete={(i) => setDeleteTarget(i)}
              onAssignCategories={(i) => setAssignTarget(i)}
            />
          ))}
        </div>
      )}

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        itemId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      <AssignCategoriesDialog
        open={!!assignTarget}
        onOpenChange={(o) => !o && setAssignTarget(null)}
        itemId={assignTarget?.id ?? 0}
        itemName={assignTarget ? (itemNames[assignTarget.id] || assignTarget.code) : undefined}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("item.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("item.deleteDesc")}</AlertDialogDescription>
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
