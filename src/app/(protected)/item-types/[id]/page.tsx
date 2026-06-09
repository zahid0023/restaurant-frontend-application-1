"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
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
import { ItemCard } from "@/components/items/item-card";
import { ItemDialog, emptyItemForm } from "@/components/items/item-dialog";
import type { ItemDialogMode, ItemFormState } from "@/components/items/types";
import { itemTypesService, type ItemType, type ItemInType } from "@/services/item-types";
import { itemsService, type ItemSummary } from "@/services/items";
import { localesApi, type Locale } from "@/services/locales";
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

  const { t } = useTranslation();

  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ItemDialogMode>("create");
  const [activeItemId, setActiveItemId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ItemFormState>(emptyItemForm);

  const [deleteTarget, setDeleteTarget] = useState<ItemInType | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await itemTypesService.get(itemTypeId);
      setItemType(res.item_type);
      setForm((prev) => {
        if (!dialogOpen || activeItemId == null) return prev;
        const updatedItem = res.item_type.items?.find((i) => i.id === activeItemId);
        if (!updatedItem) return prev;
        return {
          ...prev,
          sort_order: updatedItem.sort_order,
          locales: updatedItem.locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description ?? "",
            sort_order: l.sort_order,
          })),
        };
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!itemTypeId) return;
    refresh();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemTypeId]);

  const items = itemType?.items ?? [];

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

  function toSummary(item: ItemInType): ItemSummary {
    return {
      id: item.id,
      code: item.code,
      sort_order: item.sort_order,
      locales: item.locales.map((l) => ({
        id: l.id,
        locale_code: "",
        name: l.name,
        description: l.description,
        sort_order: l.sort_order,
      })),
    };
  }

  function openCreate() {
    setDialogMode("create");
    setActiveItemId(undefined);
    setForm({ ...emptyItemForm, item_type_id: itemTypeId });
    setDialogOpen(true);
  }

  function openView(summary: ItemSummary) {
    const full = items.find((i) => i.id === summary.id);
    if (!full) return;
    setDialogMode("view");
    setActiveItemId(full.id);
    setForm({
      code: full.code,
      item_type_id: itemTypeId,
      unit_type_id: full.unit_type.id,
      sort_order: full.sort_order,
      locales: full.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setDialogOpen(true);
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

  const itemTypeName = itemType?.locales[0]?.name ?? itemType?.code ?? "";
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
        ) : (
          <div className="h-14 animate-pulse bg-muted rounded-lg" />
        )}
      </div>

      {/* Items section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("item.pageTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("item.pageSubtitle")}</p>
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
                  className="pl-9 pr-9 w-56 rounded-l-none"
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
                item={toSummary(item)}
                defaultName={itemNames[item.id]}
                onView={openView}
                onDelete={(summary) => {
                  const full = items.find((i) => i.id === summary.id);
                  if (full) setDeleteTarget(full);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item dialog */}
      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        itemId={activeItemId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("item.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("item.deleteDesc")}
            </AlertDialogDescription>
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
