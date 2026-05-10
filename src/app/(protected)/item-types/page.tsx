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
import { ItemTypeCard } from "@/components/item-types/item-type-card";
import { ItemTypeDialog, emptyItemTypeForm } from "@/components/item-types/item-type-dialog";
import type { ItemTypeDialogMode, ItemTypeFormState } from "@/components/item-types/types";
import { itemTypesService } from "@/services/item-types";
import type { ItemType, ItemTypeLocale } from "@/services/item-types";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name";

export default function ItemTypesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("common.allFields"),
    code: t("common.code"),
    name: t("common.localizedName"),
  };

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [localeRows, setLocaleRows] = useState<Record<number, ItemTypeLocale[]>>({});
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ItemTypeDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ItemTypeFormState>(emptyItemTypeForm);

  const [deleteTarget, setDeleteTarget] = useState<ItemType | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await itemTypesService.list({ size: 50, sort_by: "sortOrder" });
      setItemTypes(res.data);
      const entries = await Promise.all(
        res.data.map(async (it) => {
          try {
            const loc = await itemTypesService.listLocales(it.id, { size: 50, sort_by: "sortOrder" });
            return [it.id, loc.data] as const;
          } catch {
            return [it.id, [] as ItemTypeLocale[]] as const;
          }
        }),
      );
      setLocaleRows(Object.fromEntries(entries));
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

  const itemTypeNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const [id, rows] of Object.entries(localeRows)) {
      out[Number(id)] = rows[0]?.name ?? "";
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localeRows, locale]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itemTypes;
    return itemTypes.filter((it) => {
      const code = it.code.toLowerCase();
      const name = (itemTypeNames[it.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        default: return code.includes(q) || name.includes(q);
      }
    });
  }, [itemTypes, itemTypeNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyItemTypeForm);
    setDialogOpen(true);
  }

  async function openDetail(it: ItemType, nextMode: "edit" | "view") {
    setMode(nextMode);
    setActiveId(it.id);
    setForm({ code: it.code, is_consumable: it.is_consumable, sort_order: it.sort_order, locales: [] });
    setDialogOpen(true);
    try {
      const res = await itemTypesService.listLocales(it.id, { size: 50 });
      setForm((prev) => ({
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
      await itemTypesService.remove(deleteTarget.id);
      toast.success(`${t("itemType.deletedToast")} ${deleteTarget.code}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("itemType.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("itemType.pageSubtitle")}</p>
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
                className="pl-9 pr-9 w-64 h-10 rounded-l-none"
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
            <Plus className="h-4 w-4 mr-1.5" /> {t("itemType.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("itemType.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("itemType.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it) => (
            <ItemTypeCard
              key={it.id}
              itemType={it}
              defaultName={itemTypeNames[it.id]}
              href={`/item-types/${it.id}`}
              onView={(item) => openDetail(item, "view")}
              onEdit={(item) => openDetail(item, "edit")}
              onDelete={(item) => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      <ItemTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        onModeChange={setMode}
        typeId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("itemType.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("itemType.deleteDesc", { code: deleteTarget?.code ?? "" })}
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
