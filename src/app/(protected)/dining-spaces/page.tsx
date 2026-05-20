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
import { DiningSpaceCard } from "@/components/dining-spaces/dining-space-card";
import {
  DiningSpaceDialog,
  emptyDiningSpaceForm,
} from "@/components/dining-spaces/dining-space-dialog";
import type { DiningSpaceDialogMode, DiningSpaceFormState } from "@/components/dining-spaces/types";
import { diningSpacesService } from "@/services/dining-spaces";
import type { DiningSpace } from "@/services/dining-spaces";
import { floorsService } from "@/services/floors";
import type { Floor } from "@/services/floors";
import { diningSpaceTypesService } from "@/services/dining-space-types";
import type { DiningSpaceType } from "@/services/dining-space-types";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name" | "type" | "floor";

export default function DiningSpacesPage() {
  const { t } = useTranslation();

  const [spaces, setSpaces] = useState<DiningSpace[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [availableFloors, setAvailableFloors] = useState<Floor[]>([]);
  const [availableTypes, setAvailableTypes] = useState<DiningSpaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<DiningSpaceDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<DiningSpaceFormState>(emptyDiningSpaceForm);

  const [deleteTarget, setDeleteTarget] = useState<DiningSpace | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await diningSpacesService.list({ size: 50, sort_by: "sortOrder" });
      setSpaces(res.data);
      setForm((prev) => {
        if (!dialogOpen || activeId == null) return prev;
        const updated = res.data.find((s) => s.id === activeId);
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
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    floorsService.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableFloors(r.data)).catch(() => {});
    diningSpaceTypesService.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableTypes(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spaceNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const s of spaces) {
      out[s.id] = s.locales[0]?.name ?? "";
    }
    return out;
  }, [spaces]);

  const typeMap = useMemo(() => {
    const out: Record<number, string> = {};
    for (const type of availableTypes) out[type.id] = type.locales[0]?.name ?? type.code;
    return out;
  }, [availableTypes]);

  const floorMap = useMemo(() => {
    const out: Record<number, string> = {};
    for (const floor of availableFloors) out[floor.id] = floor.locales[0]?.name ?? floor.code;
    return out;
  }, [availableFloors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter((s) => {
      const code = s.code.toLowerCase();
      const name = (spaceNames[s.id] ?? "").toLowerCase();
      const type = (typeMap[s.dining_space_type_id] ?? "").toLowerCase();
      const floor = s.floor_id != null ? (floorMap[s.floor_id] ?? "").toLowerCase() : "";
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        case "type": return type.includes(q);
        case "floor": return floor.includes(q);
        default: return code.includes(q) || name.includes(q) || type.includes(q) || floor.includes(q);
      }
    });
  }, [spaces, spaceNames, typeMap, floorMap, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyDiningSpaceForm);
    setDialogOpen(true);
  }

  function openView(s: DiningSpace) {
    setMode("view");
    setActiveId(s.id);
    setForm({
      dining_space_type_id: s.dining_space_type_id,
      floor_id: s.floor_id,
      code: s.code,
      sort_order: s.sort_order,
      capacity: s.capacity,
      is_bookable: s.is_bookable,
      locales: s.locales.map((l) => ({
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
      await diningSpacesService.remove(deleteTarget.id);
      toast.success(`${t("diningSpace.deletedToast")} ${deleteTarget.code}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("diningSpace.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("diningSpace.pageSubtitle")}</p>
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
                <SelectItem value="type">{t("diningSpace.type")}</SelectItem>
                <SelectItem value="floor">{t("diningSpace.floor")}</SelectItem>
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
            <Plus className="h-4 w-4 mr-1.5" /> {t("diningSpace.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("diningSpace.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("diningSpace.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <DiningSpaceCard
              key={s.id}
              diningSpace={s}
              defaultName={spaceNames[s.id]}
              typeLabel={typeMap[s.dining_space_type_id]}
              floorLabel={s.floor_id != null ? floorMap[s.floor_id] : undefined}
              onView={openView}
              onDelete={(space) => setDeleteTarget(space)}
            />
          ))}
        </div>
      )}

      <DiningSpaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        spaceId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        availableFloors={availableFloors}
        availableTypes={availableTypes}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("diningSpace.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("diningSpace.deleteDesc", { code: deleteTarget?.code ?? "" })}
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
