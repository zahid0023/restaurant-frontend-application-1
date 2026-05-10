# Localization Strategy

This application runs two parallel localization layers that must stay in sync: **UI strings** (static copy rendered by React components) and **API content** (dynamic data stored per-locale in the backend database).

---

## Layer 1 — UI Strings (react-i18next)

### Setup

```
src/i18n/index.ts               — i18next initialization
src/i18n/locales/en.json        — English translation bundle
src/i18n/locales/bn.json        — Bengali translation bundle
src/providers/i18n-provider.tsx — client-side bootstrap wrapper
```

`i18n/index.ts` initializes i18next with `LanguageDetector` and `initReactI18next`. The detector checks `localStorage["app.lang"]` first, then the browser `navigator.language`. The chosen language is written back to `localStorage["app.lang"]` so it persists across sessions.

```ts
export const SUPPORTED_LANGS = ["en", "bn"] as const;
```

`I18nProvider` is a `"use client"` wrapper placed in the root layout. Its only job is to import `@/i18n` on the client side — Next.js App Router server components cannot run i18next.

### Usage in components

```tsx
const { t, i18n } = useTranslation();

t("shops.subtitle")                          // plain key
t("shops.welcome", { name: "Alice" })        // interpolation
t("createShop.translationsCount", { count }) // plural
```

Translation keys are namespaced by feature (`login`, `shops`, `shopDialog`, `createShop`, `itemCategory`, `shopItem`, `portal`, `common`). All keys must exist in both `en.json` and `bn.json`.

### Language toggle

`src/components/language-toggle.tsx` renders a segmented pill (EN / বাং). Clicking a segment calls `i18n.changeLanguage(lang)` and sets `document.documentElement.lang` for accessibility. No page reload is required — all `t()` calls re-render reactively.

---

## Layer 2 — API Content (backend locale sub-resources)

Dynamic content (shop names, descriptions, shop type names, item names, etc.) is stored in the backend as locale rows attached to each entity. The frontend resolves these at render time using the current UI language.

### locale_id resolution via API

`locale_id` values are assigned by the backend database and must not be hardcoded on the frontend. The correct `locale_id` for the current language is resolved at runtime by calling `GET /locales` and matching `locale.code` against `i18n.language`.

This is handled by the `useLocaleId()` hook (`src/lib/use-locale-id.ts`):

```ts
// Pseudocode of the resolution logic
const lang = i18n.resolvedLanguage;          // e.g. "en" or "bn"
const locales = await localesApi.list();     // [{ id: 1, code: "en" }, { id: 2, code: "bn" }, ...]
const localeId = locales.find(l => l.code === lang)?.id ?? 1;
```

Example — given the backend returns:

```json
[
  { "id": 1, "code": "en", "name": "English" },
  { "id": 2, "code": "bn", "name": "Bengali" }
]
```

- UI language `"en"` → `locale_id: 1`
- UI language `"bn"` → `locale_id: 2`

The mapping is fully dynamic: no frontend code needs to change when locales are added or reordered in the database.

### Caching

`useLocaleId()` uses a module-level cache so `GET /locales` is called **once per browser session**, regardless of how many components call the hook. The result is shared across all instances.

```
First mount of any component using useLocaleId()
  → fetch /locales → store in module cache
All subsequent mounts
  → read from cache, no network request
Language change (EN → বাং)
  → re-resolve against the cached list, update localeId state
```

### useLocaleId hook

```ts
// src/lib/use-locale-id.ts
import { useLocaleId } from "@/lib/use-locale-id";

const localeId = useLocaleId(); // e.g. 1 for "en", 2 for "bn"
```

Use this hook in any component that needs to resolve API locale data. Falls back to `1` while the first fetch is in flight.

### Resolver functions

All locale resolution lives in `src/lib/shop-type-name.ts`:

| Function | Input | Fallback chain |
|---|---|---|
| `resolveShopName` | `shop.shop_locales[]`, `localeId` | exact locale_id match → first locale → `shop.code` |
| `resolveShopDescription` | `shop.shop_locales[]`, `localeId` | exact locale_id match → first locale → `""` |
| `resolveShopTypeName` | `shop_type.shop_type_locales[]`, `localeId` | exact locale_id match → first locale → `shopType.code` |

The fallback to `locales[0]` means content is always shown even if the user's language has no translation yet, rather than showing a blank.

### How components consume it

```tsx
// src/components/shops/shop-card.tsx
import { useLocaleId } from "@/lib/use-locale-id";
import { resolveShopName, resolveShopDescription, resolveShopTypeName } from "@/lib/shop-type-name";

const localeId = useLocaleId();

const name        = resolveShopName(shop.code, shop.shop_locales, localeId);
const description = resolveShopDescription(shop.shop_locales, localeId);
const typeName    = resolveShopTypeName(shop.shop_type, localeId);
```

Switching the UI language updates `i18n.resolvedLanguage`, which updates `localeId` inside `useLocaleId`, which triggers a re-render — no refetch needed because the full `shop_locales` array is already embedded in the list API response.

### API response shape

The backend embeds locale arrays directly in list and get responses:

```json
{
  "id": 1,
  "code": "TEST_SHOP_CODE_1",
  "sort_order": 1,
  "shop_type": {
    "id": 1,
    "code": "GROCERY_SHOP",
    "shop_type_locales": [
      { "id": 1, "locale_id": 1, "name": "Grocery Shop", "description": "Shops selling daily essentials...", "sort_order": 1 },
      { "id": 2, "locale_id": 2, "name": "মুদি দোকান",   "description": "দৈনন্দিন প্রয়োজনীয়...",          "sort_order": 2 }
    ]
  },
  "shop_locales": [
    { "id": 1, "locale_id": 1, "name": "Test Shop Name 1",    "description": "Test Shop Description 1", "sort_order": 1 },
    { "id": 2, "locale_id": 2, "name": "টেস্ট দোকানের নাম ১", "description": "টেস্ট বর্ণনা ১",          "sort_order": 2 }
  ]
}
```

No additional API calls are needed to display localized content in list views.

### Locales API

`GET /locales` is the source of truth for which locales exist and what their IDs are.

```ts
// src/services/locales.ts
export interface Locale {
  id: number;        // database-assigned — do NOT hardcode this
  code: string;      // BCP-47 base tag: "en", "bn", "fr", ...
  name: string;      // display name: "English", "Bengali", ...
  description?: string;
  sort_order: number;
}

localesApi.list({ size: 50 })  // returns PageResponse<Locale>
```

This same endpoint drives the locale language dropdown in create/edit dialogs, ensuring the dropdown always reflects exactly what the backend supports.

### Writing locale data

When creating or editing an entity, the dialog collects locale rows from the user:

```
ShopFormState.locales: ShopLocaleRow[]
  { locale_id, name, description, sort_order, _new?, id? }
```

On submit:
- **Create**: locales are sent in the request body under `locales[]`.
- **Edit**: rows with `_new: true` → `POST /shops/{id}/locales`; existing rows (have `id`) → `PUT /shops/{id}/locales/{localeId}`.

---

## Data flow diagram

```
User clicks language toggle (EN → বাং)
        |
        v
i18n.changeLanguage("bn")
  - localStorage["app.lang"] = "bn"
  - document.documentElement.lang = "bn"
  - all useTranslation() subscribers re-render
        |
        +---> UI strings: t("key") returns bn.json values
        |
        +---> useLocaleId() re-resolves:
                lang = "bn"
                localeCache = [{ id:1, code:"en" }, { id:2, code:"bn" }]
                localeId = 2   (matched by code, no network call)
                  |
                  v
              resolveShopName(shop.shop_locales, 2)
                → finds { locale_id: 2, name: "টেস্ট দোকানের নাম ১" }
              resolveShopDescription(shop.shop_locales, 2)
                → finds { locale_id: 2, description: "টেস্ট বর্ণনা ১" }
              resolveShopTypeName(shop.shop_type, 2)
                → finds { locale_id: 2, name: "মুদি দোকান" }
                  |
                  v
              Card re-renders with Bengali locale data
              (no network request — data already in memory)
```

---

## Adding a new language

1. **Backend**: create a `Locale` record (e.g. `{ code: "fr", name: "French", sort_order: 3 }`). The backend assigns an `id` — note it only for reference; the frontend never hardcodes it.
2. **`src/i18n/index.ts`**: add `"fr"` to `SUPPORTED_LANGS`.
3. **`src/i18n/locales/fr.json`**: create a full translation of `en.json`.
4. **`src/components/language-toggle.tsx`**: add a display label in `LANG_LABELS` (e.g. `fr: "FR"`).

Steps 2–4 cover UI strings. Step 1 covers API content — `useLocaleId()` will automatically resolve the new locale's ID at runtime with no frontend code change needed.

---

## Key files reference

| File | Purpose |
|---|---|
| `src/i18n/index.ts` | i18next init, `SUPPORTED_LANGS` |
| `src/i18n/locales/en.json` | English UI strings |
| `src/i18n/locales/bn.json` | Bengali UI strings |
| `src/providers/i18n-provider.tsx` | Client-side i18next bootstrap |
| `src/lib/use-locale-id.ts` | `useLocaleId()` — resolves `locale_id` from API by language code |
| `src/lib/shop-type-name.ts` | `resolveShopName`, `resolveShopDescription`, `resolveShopTypeName` |
| `src/components/language-toggle.tsx` | EN / বাং toggle UI |
| `src/services/locales.ts` | `localesApi` — source of truth for available locales and their IDs |
| `src/services/shops.ts` | `Shop.shop_locales` embedded array type |
| `src/services/shop-types.ts` | `ShopType.shop_type_locales` embedded array type |
