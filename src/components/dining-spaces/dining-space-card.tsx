import { Pencil, Trash2, Eye } from "lucide-react";
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
  onEdit?: (ds: DiningSpace) => void;
  onDelete?: (ds: DiningSpace) => void;
}

export function DiningSpaceCard({
  diningSpace,
  defaultName,
  typeLabel,
  floorLabel,
  onView,
  onEdit,
  onDelete,
}: DiningSpaceCardProps) {
  const { t } = useTranslation();
  const ds = diningSpace;

  const title = defaultName?.trim() || ds.code;
  const subtitle = defaultName?.trim() ? `${ds.code} · ID #${ds.id}` : `ID #${ds.id}`;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
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
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="secondary">#{ds.sort_order}</Badge>
          <Badge variant={ds.is_bookable ? "default" : "outline"} className="text-xs">
            {ds.is_bookable ? t("diningSpace.bookable") : t("diningSpace.notBookable")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
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

      {(onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onView && (
            <Button variant="ghost" size="icon" aria-label="View" onClick={() => onView(ds)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(ds)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => onDelete(ds)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
