"use client";

import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { UnitTypeSummary } from "@/services/unit-types";

export interface UnitTypeCardProps {
  unitType: UnitTypeSummary;
  onView?: (ut: UnitTypeSummary) => void;
  onDelete?: (ut: UnitTypeSummary) => void;
}

export function UnitTypeCard({ unitType, onView, onDelete }: UnitTypeCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const ut = unitType;

  const goToDetail = () => router.push(`/unit-types/${ut.id}`);

  const handleAction = (e: React.MouseEvent, handler?: (u: UnitTypeSummary) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(ut);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToDetail(); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {ut.code.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate font-mono">{ut.code}</h3>
            <p className="text-xs text-muted-foreground truncate">ID #{ut.id}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleAction(e, onView)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleAction(e, onDelete)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{ut.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{t("common.code")}: {ut.code}</span>
      </div>
    </Card>
  );
}
