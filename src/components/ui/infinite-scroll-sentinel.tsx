"use client";

import { Loader2 } from "lucide-react";

interface InfiniteScrollSentinelProps {
  sentinelRef: (el: Element | null) => void;
  loadingMore: boolean;
  hasNext: boolean;
}

/**
 * Drop this at the bottom of any paginated list.
 * It acts as the IntersectionObserver target and shows a spinner while loading.
 */
export function InfiniteScrollSentinel({
  sentinelRef,
  loadingMore,
  hasNext,
}: InfiniteScrollSentinelProps) {
  if (!hasNext && !loadingMore) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
    </div>
  );
}
