import { Pencil, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Floor } from "@/services/floors";

export interface FloorCardProps {
  floor: Floor;
  defaultName?: string;
  onView?: (floor: Floor) => void;
  onEdit?: (floor: Floor) => void;
  onDelete?: (floor: Floor) => void;
}

export function FloorCard({ floor, defaultName, onView, onEdit, onDelete }: FloorCardProps) {
  const title = defaultName?.trim() || floor.code;
  const subtitle = defaultName?.trim() ? `${floor.code} · ID #${floor.id}` : `ID #${floor.id}`;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {floor.code.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">#{floor.sort_order}</Badge>
      </div>

      {(onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onView && (
            <Button variant="ghost" size="icon" aria-label="View" onClick={() => onView(floor)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(floor)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => onDelete(floor)}
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
