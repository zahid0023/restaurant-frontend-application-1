<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design System Rules — MANDATORY, NO EXCEPTIONS

## Card containers
- General info section: ALWAYS `<Card><CardContent className="space-y-4">...</CardContent></Card>`
- Locale/list section: ALWAYS `<Card className="gap-0 py-0 overflow-hidden">...</Card>`
- NEVER use raw `<div className="rounded-xl border bg-card ...">` — use `<Card>` every time
- Import: `import { Card, CardContent } from "@/components/ui/card";`

## Field layout
- Every input field is its own **full-width** row: `<div className="space-y-2"><Label /><Input /></div>`
- **NO grids** (`grid-cols-*`), **NO multi-column layouts** for form fields
- `<SelectTrigger>` inside rows always has `w-full` class

## Canonical reference
Look at `src/components/countries/country-general-info.tsx` and `src/components/countries/country-locale-translations.tsx` — all dialogs must match this pattern exactly.
