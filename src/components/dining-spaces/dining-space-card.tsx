"use client";

import { Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { DiningSpace } from "@/services/dining-spaces";

export interface DiningSpaceCardProps {
  diningSpace: DiningSpace;
  defaultName?: string;
  typeLabel?: string;
  floorLabel?: string;
  onView?: (ds: DiningSpace) => void;
  onDelete?: (ds: DiningSpace) => void;
}

export function DiningSpaceCard({
  diningSpace,
  defaultName,
  typeLabel,
  floorLabel,
  onView,
  onDelete,
}: DiningSpaceCardProps) {
  const { t } = useTranslation();
  const ds = diningSpace;

  const title = defaultName?.trim() || ds.code;
  const subtitle = defaultName?.trim() ? `${ds.code} · ID #${ds.id}` : `ID #${ds.id}`;

  const handleAction = (e: React.MouseEvent, handler?: (d: DiningSpace) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(ds);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(ds)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(ds); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {ds.code.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
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

      <div className="grid grid-cols-2 gap-3 text-sm mt-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("diningSpace.type")}</p>
          <p className="font-medium truncate">{typeLabel ?? `#${ds.dining_space_type_id}`}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("diningSpace.floor")}</p>
          <p className="font-medium truncate">
            {ds.floor_id != null ? (floorLabel ?? `#${ds.floor_id}`) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("diningSpace.capacity")}</p>
          <p className="font-medium">{ds.capacity}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">#{ds.sort_order}</Badge>
          <Badge variant={ds.is_bookable ? "default" : "outline"} className="text-xs">
            {ds.is_bookable ? t("diningSpace.bookable") : t("diningSpace.notBookable")}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{ds.locales.length} locale{ds.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
