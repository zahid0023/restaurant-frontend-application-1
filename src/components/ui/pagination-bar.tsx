"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function PaginationBar({ page, totalPages, totalElements, onPageChange, itemLabel }: PaginationBarProps) {
  const { t } = useTranslation();
  const safeTotal = Math.max(totalPages, 1);

  function getPageNumbers(): (number | "ellipsis")[] {
    if (safeTotal <= 7) return Array.from({ length: safeTotal }, (_, i) => i);
    if (page < 4) return [0, 1, 2, 3, 4, "ellipsis", safeTotal - 1];
    if (page >= safeTotal - 4) return [0, "ellipsis", safeTotal - 5, safeTotal - 4, safeTotal - 3, safeTotal - 2, safeTotal - 1];
    return [0, "ellipsis", page - 1, page, page + 1, "ellipsis", safeTotal - 1];
  }

  return (
    <div className="flex items-center justify-between border-t pt-3">
      <span className="text-xs text-muted-foreground">
        {t("common.page")} {page + 1} {t("common.of")} {safeTotal}
        {totalElements > 0 && (
          <> &middot; {totalElements}{itemLabel ? ` ${itemLabel}` : ""}</>
        )}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {getPageNumbers().map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-0.5">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-7 w-7 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page >= safeTotal - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
