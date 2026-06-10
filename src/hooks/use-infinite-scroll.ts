"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ListParams, PageResponse } from "@/services/common";

interface UseInfiniteScrollOptions<T> {
  /** The service list function, e.g. `itemTypesService.list` */
  fetchFn: (params: ListParams) => Promise<PageResponse<T>>;
  /** Params other than `page` (size, sort_by, sort_dir). Changes here reset to page 0. */
  params?: Omit<ListParams, "page">;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  /** True only on the very first load */
  loading: boolean;
  /** True when fetching additional pages */
  loadingMore: boolean;
  hasNext: boolean;
  error: string | null;
  /** Attach to a sentinel element at the bottom of your list */
  sentinelRef: (el: Element | null) => void;
  /** Call to manually reload from page 0 (e.g. after a delete/create) */
  reset: () => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  params = {},
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable ref for params so the effect doesn't re-run on every render
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Synchronous guard — prevents the observer from firing a second fetch
  // before React re-renders with the updated loadingMore state
  const fetchingRef = useRef(false);

  // Serialise params to detect real changes (size, sort_by, sort_dir)
  const paramsKey = JSON.stringify(params);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (replace) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetchFn({ ...paramsRef.current, page: pageNum });
        setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
        setHasNext(res.has_next);
        setPage(pageNum);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    // fetchFn identity is expected to be stable (module-level object method)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchFn],
  );

  // Reset whenever params change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPage(0, true); }, [paramsKey]);

  // IntersectionObserver sentinel
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const hasNextRef = useRef(hasNext);
  hasNextRef.current = hasNext;

  const sentinelRef = useCallback(
    (el: Element | null) => {
      observerRef.current?.disconnect();
      if (!el) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasNextRef.current && !fetchingRef.current) {
            fetchPage(pageRef.current + 1, false);
          }
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(el);
    },
    // sentinelRef only needs to be recreated when fetchPage changes (never)
    [fetchPage],
  );

  const reset = useCallback(() => fetchPage(0, true), [fetchPage]);

  return { items, loading, loadingMore, hasNext, error, sentinelRef, reset };
}
