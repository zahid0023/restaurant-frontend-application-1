"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { UnitCard } from "@/components/units/unit-card";
import { UnitDialog, emptyUnitForm } from "@/components/units/unit-dialog";
import type { UnitDialogMode, UnitFormState } from "@/components/units/types";
import { unitTypesService, type UnitType } from "@/services/unit-types";
import { unitsService, type Unit } from "@/services/units";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function UnitTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const unitTypeId = Number(idStr);
  const { t } = useTranslation();

  const [unitType, setUnitType] = useState<UnitType | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Unit dialog
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitDialogMode, setUnitDialogMode] = useState<UnitDialogMode>("create");
  const [activeUnitId, setActiveUnitId] = useState<number | undefined>(undefined);
  const [unitForm, setUnitForm] = useState<UnitFormState>(emptyUnitForm);

  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  async function refreshUnitType() {
    try {
      const res = await unitTypesService.get(unitTypeId);
      setUnitType(res.unit_type);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function refreshUnits() {
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

  useEffect(() => {
    if (!unitTypeId) return;
    refreshUnitType();
    refreshUnits();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitTypeId]);

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

  function openCreateUnit() {
    setUnitDialogMode("create");
    setActiveUnitId(undefined);
    setUnitForm(emptyUnitForm);
    setUnitDialogOpen(true);
  }

  function openViewUnit(u: Unit) {
    setUnitDialogMode("view");
    setActiveUnitId(u.id);
    setUnitForm({
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
    setUnitDialogOpen(true);
  }

  async function handleUnitSaved() {
    await refreshUnits();
    if (activeUnitId != null && unitDialogOpen) {
      try {
        const res = await unitsService.get(unitTypeId, activeUnitId);
        const u = res.unit;
        setUnitForm((prev) => ({
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
    if (!deleteTarget) return;
    try {
      await unitsService.remove(unitTypeId, deleteTarget.id);
      toast.success(`${t("unit.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refreshUnits();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back + header */}
      <div className="space-y-4">
        <Link
          href="/unit-types"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("unitType.backToTypes")}
        </Link>

        {unitType ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{unitType?.locales[0]?.name ?? unitType?.code ?? `#${unitTypeId}`}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground font-mono">{unitType.code}</span>
              <Badge variant="secondary" className="text-xs">#{unitType.sort_order}</Badge>
            </div>
          </div>
        ) : (
          <div className="h-14 animate-pulse bg-muted rounded-lg" />
        )}
      </div>

      {/* Units section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("unit.pageTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("unit.pageSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button onClick={openCreateUnit}>
              <Plus className="h-4 w-4 mr-1.5" /> {t("unit.new")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("unit.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {search ? t("unit.empty") : t("unit.emptyForType")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((u) => (
              <UnitCard
                key={u.id}
                unit={u}
                defaultName={unitNames[u.id]}
                onView={(unit) => openViewUnit(unit)}
                onDelete={(unit) => setDeleteTarget(unit)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unit dialog */}
      <UnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        mode={unitDialogMode}
        unitTypeId={unitTypeId}
        unitId={activeUnitId}
        form={unitForm}
        onFormChange={setUnitForm}
        availableLocales={availableLocales}
        onSaved={handleUnitSaved}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unit.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("unit.deleteDesc", { code: deleteTarget?.code ?? "" })}</AlertDialogDescription>
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
