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
import { FloorCard } from "@/components/floors/floor-card";
import { FloorDialog, emptyFloorForm } from "@/components/floors/floor-dialog";
import type { FloorDialogMode, FloorFormState } from "@/components/floors/types";
import { floorsService, type Floor } from "@/services/floors";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

type SearchField = "all" | "code" | "name";

export default function FloorsPage() {
  const { t } = useTranslation();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<FloorDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<FloorFormState>(emptyFloorForm);

  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await floorsService.list({ size: 50, sort_by: "sortOrder" });
      setFloors(res.data);
      setForm((prev) => {
        if (!dialogOpen || activeId == null) return prev;
        const updated = res.data.find((f) => f.id === activeId);
        if (!updated) return prev;
        return {
          ...prev,
          locales: updated.locales.map((l) => ({
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
    refresh();
    localesApi
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floorNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const f of floors) {
      out[f.id] = f.locales[0]?.name ?? "";
    }
    return out;
  }, [floors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return floors;
    return floors.filter((f) => {
      const code = f.code.toLowerCase();
      const name = (floorNames[f.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        default: return code.includes(q) || name.includes(q);
      }
    });
  }, [floors, floorNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyFloorForm);
    setDialogOpen(true);
  }

  function openView(f: Floor) {
    setMode("view");
    setActiveId(f.id);
    setForm({
      code: f.code,
      sort_order: f.sort_order,
      locales: f.locales.map((l) => ({
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
      await floorsService.remove(deleteTarget.id);
      toast.success(`${t("floor.deletedToast")} ${deleteTarget.code}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("floor.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("floor.pageSubtitle")}</p>
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
            <Plus className="h-4 w-4 mr-1.5" /> {t("floor.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("floor.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("floor.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <FloorCard
              key={f.id}
              floor={f}
              defaultName={floorNames[f.id]}
              onView={(floor) => openView(floor)}
              onDelete={(floor) => setDeleteTarget(floor)}
            />
          ))}
        </div>
      )}

      <FloorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        floorId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("floor.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("floor.deleteDesc", { code: deleteTarget?.code ?? "" })}
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
