"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale, Plus, Search, X } from "lucide-react";
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
import { UnitCard } from "@/components/units/unit-card";
import { UnitDialog, emptyUnitForm } from "@/components/units/unit-dialog";
import type { UnitDialogMode, UnitFormState } from "@/components/units/types";
import { unitsService, type Unit } from "@/services/units";
import { unitTypesService, type UnitTypeSummary } from "@/services/unit-types";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

export default function UnitsPage() {
  const { t } = useTranslation();

  const [unitTypes, setUnitTypes] = useState<UnitTypeSummary[]>([]);
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<number | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<UnitDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<UnitFormState>(emptyUnitForm);

  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  useEffect(() => {
    unitTypesService.list({ size: 50, sort_by: "sortOrder" }).then((r) => setUnitTypes(r.data)).catch(() => {});
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
  }, []);

  async function refresh(unitTypeId: number) {
    setLoading(true);
    try {
      const res = await unitsService.list(unitTypeId, { size: 50, sort_by: "sortOrder" });
      setUnits(res.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleUnitTypeChange(val: string) {
    const id = Number(val);
    setSelectedUnitTypeId(id);
    setSearch("");
    setUnits([]);
    refresh(id);
  }

  const unitNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const u of units) out[u.id] = u.locales[0]?.name ?? "";
    return out;
  }, [units]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) =>
      u.code.toLowerCase().includes(q) || (unitNames[u.id] ?? "").toLowerCase().includes(q),
    );
  }, [units, unitNames, search]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyUnitForm);
    setDialogOpen(true);
  }

  function openView(u: Unit) {
    setMode("view");
    setActiveId(u.id);
    setForm({
      code: u.code,
      is_base: u.is_base,
      sort_order: u.sort_order,
      locales: u.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setDialogOpen(true);
  }

  async function handleSaved() {
    if (selectedUnitTypeId == null) return;
    await refresh(selectedUnitTypeId);
    if (activeId != null && dialogOpen) {
      try {
        const res = await unitsService.get(selectedUnitTypeId, activeId);
        const u = res.unit;
        setForm((prev) => ({
          ...prev,
          is_base: u.is_base,
          sort_order: u.sort_order,
          locales: u.locales.map((l) => ({
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
    if (!deleteTarget || selectedUnitTypeId == null) return;
    try {
      await unitsService.remove(selectedUnitTypeId, deleteTarget.id);
      toast.success(`${t("unit.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refresh(selectedUnitTypeId);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("unit.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("unit.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedUnitTypeId ? String(selectedUnitTypeId) : ""} onValueChange={handleUnitTypeChange}>
            <SelectTrigger className="w-52 h-10">
              <SelectValue placeholder={t("unit.selectUnitType")} />
            </SelectTrigger>
            <SelectContent>
              {unitTypes.map((ut) => (
                <SelectItem key={ut.id} value={String(ut.id)}>
                  {ut.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedUnitTypeId != null && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${t("common.search")}…`}
                  className="pl-9 pr-9 w-56 h-10"
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
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" /> {t("unit.new")}
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedUnitTypeId == null ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-xl border-dashed gap-3">
          <Scale className="h-8 w-8 opacity-30" />
          <p className="text-sm">{t("unit.selectUnitType")}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("unit.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("unit.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <UnitCard
              key={u.id}
              unit={u}
              defaultName={unitNames[u.id]}
              onView={(unit) => openView(unit)}
              onDelete={(unit) => setDeleteTarget(unit)}
            />
          ))}
        </div>
      )}

      {selectedUnitTypeId != null && (
        <UnitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={mode}
          unitTypeId={selectedUnitTypeId}
          unitId={activeId}
          form={form}
          onFormChange={setForm}
          availableLocales={availableLocales}
          onSaved={handleSaved}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unit.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unit.deleteDesc", { code: deleteTarget?.code ?? "" })}
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
