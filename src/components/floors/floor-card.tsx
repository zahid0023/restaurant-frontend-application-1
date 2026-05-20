"use client";

import { Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Floor } from "@/services/floors";

export interface FloorCardProps {
  floor: Floor;
  defaultName?: string;
  onView?: (floor: Floor) => void;
  onDelete?: (floor: Floor) => void;
}

export function FloorCard({ floor, defaultName, onView, onDelete }: FloorCardProps) {
  const title = defaultName?.trim() || floor.code;
  const subtitle = defaultName?.trim() ? `${floor.code} · ID #${floor.id}` : `ID #${floor.id}`;

  const handleAction = (e: React.MouseEvent, handler?: (f: Floor) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(floor);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(floor)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(floor); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
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
        <Badge variant="secondary">#{floor.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{floor.locales.length} locale{floor.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
