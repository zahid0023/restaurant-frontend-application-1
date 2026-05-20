"use client";

import { useEffect, useState } from "react";
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
import { UnitTypeCard } from "@/components/unit-types/unit-type-card";
import { UnitTypeDialog, emptyUnitTypeForm } from "@/components/unit-types/unit-type-dialog";
import type { UnitTypeDialogMode, UnitTypeFormState } from "@/components/unit-types/types";
import { unitTypesService, type UnitType, type UnitTypeSummary } from "@/services/unit-types";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

type SearchField = "all" | "code";

export default function UnitTypesPage() {
  const { t } = useTranslation();

  const [unitTypes, setUnitTypes] = useState<UnitTypeSummary[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<UnitTypeDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<UnitTypeFormState>(emptyUnitTypeForm);

  const [deleteTarget, setDeleteTarget] = useState<UnitTypeSummary | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await unitTypesService.list({ size: 50, sort_by: "sortOrder" });
      setUnitTypes(res.data);
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

  const filtered = unitTypes.filter((ut) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return ut.code.toLowerCase().includes(q);
  });

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyUnitTypeForm);
    setDialogOpen(true);
  }

  async function openView(ut: UnitTypeSummary) {
    setMode("view");
    setActiveId(ut.id);
    setForm({ code: ut.code, sort_order: ut.sort_order, locales: [] });
    setDialogOpen(true);
    try {
      const res = await unitTypesService.get(ut.id);
      const full: UnitType = res.unit_type;
      setForm({
        code: full.code,
        sort_order: full.sort_order,
        locales: full.locales.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleSaved() {
    await refresh();
    // If dialog is open and viewing an existing item, re-fetch its locales
    if (activeId != null && dialogOpen) {
      try {
        const res = await unitTypesService.get(activeId);
        const full: UnitType = res.unit_type;
        setForm((prev) => ({
          ...prev,
          sort_order: full.sort_order,
          locales: full.locales.map((l) => ({
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
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await unitTypesService.remove(deleteTarget.id);
      toast.success(`${t("unitType.deletedToast")} ${deleteTarget.code}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("unitType.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("unitType.pageSubtitle")}</p>
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
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.search")}…`}
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
            <Plus className="h-4 w-4 mr-1.5" /> {t("unitType.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("unitType.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("unitType.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ut) => (
            <UnitTypeCard
              key={ut.id}
              unitType={ut}
              onView={(item) => openView(item)}
              onDelete={(item) => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      <UnitTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        unitTypeId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unitType.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unitType.deleteDesc", { code: deleteTarget?.code ?? "" })}
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
