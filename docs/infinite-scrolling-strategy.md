# Infinite Scrolling Strategy

## Overview

All paginated list pages in this application use a shared infinite scroll system built on top of the `PageResponse<T>` contract returned by the API. Instead of numbered page controls, additional records are loaded automatically as the user scrolls to the bottom of the list.

---

## Core Files

| File | Role |
|---|---|
| `src/hooks/use-infinite-scroll.ts` | Generic React hook — owns all pagination state and the `IntersectionObserver` |
| `src/components/ui/infinite-scroll-sentinel.tsx` | Sentinel element placed at the bottom of a list; triggers the observer and renders the loading spinner |
| `src/services/common.ts` | Defines `PageResponse<T>` and `ListParams` — the shared contract between the hook and every service |

---

## How It Works

### 1. API Contract

Every list endpoint returns a `PageResponse<T>`:

```ts
interface PageResponse<T> {
  data: T[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}
```

The hook uses `has_next` to decide whether more pages exist and `current_page` to calculate the next page number.

### 2. The Hook — `useInfiniteScroll`

```ts
const { items, loading, loadingMore, hasNext, error, sentinelRef, reset } =
  useInfiniteScroll({
    fetchFn: someService.list,   // any (params: ListParams) => Promise<PageResponse<T>>
    params: { size: 20, sort_by: "sortOrder" },
  });
```

**State managed by the hook:**

| Property | Type | Description |
|---|---|---|
| `items` | `T[]` | Accumulated records across all loaded pages |
| `loading` | `boolean` | `true` only during the initial page-0 fetch |
| `loadingMore` | `boolean` | `true` while fetching page 1+ |
| `hasNext` | `boolean` | Whether another page is available |
| `error` | `string \| null` | Last fetch error message, if any |
| `sentinelRef` | `(el) => void` | Ref callback — attach to the sentinel element |
| `reset` | `() => void` | Reload from page 0 (e.g. after create/delete) |

**Automatic reset on param changes:**

The hook serialises `params` to a key. When that key changes (e.g. sort order switches, page size changes), the hook discards accumulated items and restarts from page 0. This means you can wire search/sort state directly into `params` without calling `reset()` manually.

### 3. The Sentinel — `IntersectionObserver`

The hook creates an `IntersectionObserver` on whatever element receives `sentinelRef`. When that element enters the viewport (threshold: 10%), the next page is fetched — but only if:

- `hasNext` is `true`
- `loadingMore` is `false`
- `loading` is `false`

This prevents duplicate requests and avoids fetching beyond the last page.

### 4. The Sentinel Component

```tsx
<InfiniteScrollSentinel
  sentinelRef={sentinelRef}
  loadingMore={loadingMore}
  hasNext={hasNext}
/>
```

- Renders `null` when there are no more pages and nothing is loading
- Renders an invisible `<div>` (the observation target) when more pages exist
- Renders a centered `Loader2` spinner while `loadingMore` is `true`

---

## Integration Guide

### Step 1 — Replace manual `list` calls with the hook

Before:
```tsx
const [items, setItems] = useState<ItemType[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  itemTypesService.list({ size: 50 }).then((r) => setItems(r.data));
}, []);
```

After:
```tsx
const { items, loading, loadingMore, hasNext, sentinelRef, reset } =
  useInfiniteScroll({
    fetchFn: itemTypesService.list,
    params: { size: 20, sort_by: "sortOrder" },
  });
```

### Step 2 — Place the sentinel at the bottom of the list

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <ItemTypeCard key={item.id} ... />
  ))}
</div>

<InfiniteScrollSentinel
  sentinelRef={sentinelRef}
  loadingMore={loadingMore}
  hasNext={hasNext}
/>
```

### Step 3 — Keep the initial loading state

```tsx
{loading ? (
  <div className="text-center py-16 text-muted-foreground">Loading…</div>
) : items.length === 0 ? (
  <div className="text-center py-16 border rounded-xl border-dashed">Empty</div>
) : (
  <>
    <div className="grid ...">
      {items.map(...)}
    </div>
    <InfiniteScrollSentinel ... />
  </>
)}
```

### Step 4 — Call `reset()` after mutations

```tsx
async function confirmDelete() {
  await someService.remove(target.id);
  reset(); // reloads from page 0
}

// In the dialog's onSaved prop:
<SomeDialog onSaved={reset} />
```

### Step 5 — Wire search/sort into `params`

Because param changes auto-reset the list, client-side filtering should be replaced with server-side params where the API supports it:

```tsx
const [sortBy, setSortBy] = useState("sortOrder");

const { items, ... } = useInfiniteScroll({
  fetchFn: someService.list,
  params: { size: 20, sort_by: sortBy },  // changing sortBy resets automatically
});
```

For fields the API does not filter (e.g. free-text search on `code`), client-side `useMemo` filtering over `items` remains acceptable since the full dataset is loaded incrementally anyway.

---

## Page Size Recommendation

| Scenario | Recommended `size` |
|---|---|
| All layouts | `20` |

`20` is the standard page size across the application.

---

## Limitations & Edge Cases

**Client-side search with infinite scroll**

When filtering happens on the client (`useMemo` over `items`), early pages may appear sparse if most records are filtered out. The sentinel won't trigger more loads until the user scrolls, but with a small page size the sentinel may remain visible and keep fetching until all records are loaded. This is acceptable behaviour.

**Deletion mid-scroll**

Calling `reset()` after a delete reloads from page 0. If the user had scrolled deep, they are returned to the top of the list. This is intentional — it prevents stale offsets caused by the removal shifting records between pages.

**Race conditions**

The hook does not cancel in-flight requests when a reset is triggered. If a slow request from a previous param set resolves after the reset, its data will be discarded because `replace: true` overwrites state on the reset fetch. Subsequent appended pages are keyed to the new page counter, so orphaned responses cannot corrupt the list.

---

## Applicable Pages

Any page whose service `list` method matches `(params: ListParams) => Promise<PageResponse<T>>` is compatible with this system. This covers all current list pages:

- `/item-types`
- `/item-categories`
- `/items`
- `/unit-types`
- `/units`
- `/countries`
- `/cities`
- `/floors`
- `/dining-spaces`
- `/dining-space-types`
- `/menu-types`
- `/menu-categories`
- `/dishes`
