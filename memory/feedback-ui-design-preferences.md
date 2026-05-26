---
name: feedback-ui-design-preferences
description: UI/UX corrections and confirmed design choices — badges, numbers, dropdowns, premium aesthetic
type: feedback
---

# UI Design Preferences (confirmed 2026-05-26)

## Role Badges / Pills
- **No visible border** — `border-0` or remove `border border-*` class entirely
- Flat colored background (low opacity) + matching text color
- Example: `className="bg-green-500/10 text-green-400 px-2 py-0.5 text-xs font-medium rounded-md"`
- Correction source: "nah ini udah bagus cuma gausah ada border roundednya hapus aja"

## Number Inputs
- No leading zeros: `05` → `5`, `01` → `1`
- When current value is `0` and user types a digit → replace entirely (don't append)
- Use `NumberInput` from `@/components/ui/number-input` — never native `<input type="number">`
- Confirmed: custom chevron up/down buttons preferred over browser-native spinners

## Dropdown Alignment (player/member lists)
- Name: left-aligned, `truncate` to handle long names
- Role badge: pushed to right with `justify-between` flex
- Pattern: `<div className="flex items-center justify-between w-full">`

## Premium Aesthetic Rules
- Dark backgrounds, glassmorphism where applicable
- Smooth transitions and micro-animations
- Avoid generic colors (plain red/blue/green) — use `emerald`, `rose`, `violet`, etc.
- Card borders: `border border-white/10` on dark bg
- Subtle bg: `bg-white/[0.04]` or `bg-zinc-900/40`

## Hero Portrait Pattern
Circular hero image consistent with /meta and /analytics:
```tsx
<div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
  <img src={getHeroImageUrl(heroName)} alt={heroName} className="h-full w-full object-cover" />
</div>
```
