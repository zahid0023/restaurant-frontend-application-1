
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { Menu } from "@/services/menus";

export interface MenuTypeCardProps {
  menuType: Menu;
  defaultName?: string;
  href?: string;
  onView?: (m: Menu) => void;
  onEdit?: (m: Menu) => void;
  onDelete?: (m: Menu) => void;
}

export function MenuTypeCard({ menuType, defaultName, href, onView, onEdit, onDelete }: MenuTypeCardProps) {
  const { t } = useTranslation();
  const m = menuType;

  const title = defaultName?.trim() || m.code;
  const subtitle = defaultName?.trim() ? `${m.code} · ID #${m.id}` : `ID #${m.id}`;

  const body = (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
          {m.code.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0">#{m.sort_order}</Badge>
    </div>
  );

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      {href ? <Link href={href} className="block">{body}</Link> : body}

      {(onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onView && (
            <Button variant="ghost" size="icon" aria-label={t("common.view")} onClick={() => onView(m)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => onEdit(m)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.delete")}
              onClick={() => onDelete(m)}
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
