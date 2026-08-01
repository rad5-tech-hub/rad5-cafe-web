# RAD5 Café — Glass Redesign Spec

Source of truth: `RAD5 Cafe.dc.html` at repo root of the workspace (one level above both
`rad5-cafe` and `rd-cafe`). It's a self-contained interactive prototype (custom `x-dc`/`sc-if`/`sc-for`
tags + a `DCLogic` component with a `renderVals()` that computes every prop). Treat its JSX-like
markup, inline styles and the `renderVals()` logic as the **exact** visual/behavioral spec — colors,
spacing, radii, shadows, blur amounts, copy strings, icon paths, and state transitions. The real apps
already implement the underlying business logic (auth, wallet, cart, admin console, etc.) via
existing routes/contexts/API calls — this is a **restyle + componentization** pass, not a rebuild.
Do not delete or break existing data-fetching/business logic; adapt the new visuals around it.

## Design tokens (light / dark)

```
--bg:            #FFFFFF        / #080D18
--surface:       rgba(255,255,255,.7)   / rgba(30,39,63,.6)
--surface-2:     rgba(255,255,255,.55)  / rgba(30,39,63,.42)
--chip:          rgba(255,255,255,.78)  / rgba(30,39,63,.72)
--sheet:         rgba(255,255,255,.9)   / rgba(16,22,38,.93)
--card:          #FFFFFF        / #141B2C
--glass-border:  rgba(255,255,255,.85)  / rgba(255,255,255,.09)
--glass-sheen:   rgba(255,255,255,.72)  / rgba(255,255,255,.06)
--viewer-bg:     rgba(244,245,247,.9)   / rgba(8,13,24,.92)
--border:        #E5E7EB        / rgba(255,255,255,.11)
--border-strong: #C7CBD3        / rgba(255,255,255,.28)
--text:          #111827        / #EDF0F6
--text-2:        #6B7280        / #97A1B4
--text-3:        #374151        / #C9D0DC
--tint:          #003D99        / #7FB0FF
--tint-dark:     #00296B        / #1B4DBE
--tint-a:        rgba(0,61,153,.06)  / rgba(127,176,255,.08)
--tint-b:        rgba(0,61,153,.11)  / rgba(127,176,255,.16)
--tint-c:        rgba(0,61,153,.3)   / rgba(127,176,255,.42)
--ink-a:         rgba(17,24,39,.05)  / rgba(255,255,255,.08)
--shadow:        rgba(0,41,107,.4)   / rgba(0,0,0,.72)
--ok-fg:  #047857/#34D399   --warn-fg: #B45309/#FBBF24   --err-fg: #B91C1C/#F87171
```
Both repos' web app already has these brand colors partially (`app/app.css` — tint #003D99,
tint-dark #00296B match already). Extend rather than replace; add the glass/surface/sheet/chip
layer + dark-mode parity + border-strong + ok/warn/err semantic colors.

Fonts: **Plus Jakarta Sans** (400/500/600/700/800) for UI text, **IBM Plex Mono** (400/500/600) for
all numeric/money/mono values (balances, prices, stats, table numbers, PIN dots, referral code).
Google Fonts import already used in the spec; for the RN app use `expo-font` + static font files or
`@expo-google-fonts` packages.

Radii: cards 18–24px, buttons/inputs 10–14px, pills/badges 999px (full).
Shadows: soft, colored with `--shadow`, e.g. `0 14px 36px -22px var(--shadow)` for resting cards,
larger spread on hover.
Blur: `backdrop-filter: blur(20-30px) saturate(150-190%)` on every glass surface. On web use CSS
`backdrop-filter`. On RN use `expo-glass-effect` (iOS 26 Liquid Glass, already a dependency in
rd-cafe) where available, falling back to `expo-blur`'s `BlurView` + semi-transparent background on
Android/older iOS.

Animations: fade+rise-in (`rad5-in`), pop-in for modals/sheets (`rad5-pop`), shimmer (loading), bar
grow-in for charts (`rad5-bar`). Mirror with RN `Animated`/`react-native-reanimated` (already a dep).

## Core visual primitives (build these as shared components first)

- **GlassPanel/Card** — the base surface: `background: var(--surface)`, blur, `1px solid
  var(--glass-border)`, soft shadow. Used everywhere as the card container.
- **GlassSheet** — heavier/opaque variant (`--sheet`) for modals/drawers.
- **Chip/Pill button** — filter chips (categories, tx filters, date ranges): pill shape, active =
  filled `--tint-dark` bg + white text, inactive = `--chip` bg + `--text-3`.
- **Primary button** — `--tint-dark` bg, white text, hover brightens to `--tint`.
- **Secondary/ghost button** — `1px solid var(--border)` + `--chip`/`--card` bg, hover border+text
  turn `--tint`.
- **Icon button** (40x40 or 36x36) — glass bg, border, centered SVG stroke icon (all icons are
  stroke-based, `stroke-width 1.7-2`, `stroke-linecap round`, paths are given verbatim in the
  `ICON` map in the script — reuse those exact path `d` strings for parity, don't invent new icons).
- **StatCard** — label (12.5px, `--text-2`), big mono value (24-26px), small sub caption.
- **DataTable** — glass container, header row tinted `--tint-a` with 11.5px uppercase tracked
  labels, rows separated by `1px solid var(--border)`, hover tint, horizontally scrollable on
  overflow (`min-width` on the grid).
- **ProductCard** (grid, café/menu) and **compact ProductRow** (dashboard "frequent items") —
  glass card, image placeholder (diagonal repeating gradient stand-in — replace with real product
  image component when available; keep the same rounded/blur treatment), name, price in mono,
  qty stepper once in cart, "Add to cart"/"Sold out" otherwise.
- **TransactionRow** — colored 2-letter tag chip (FD/PY/TR/RW) + label/timestamp + status pill +
  right-aligned mono amount (green add, red/neutral subtract).
- **Sidebar/NavRail** (web only, desktop) — collapsible glass rail, 246px ↔ 74px, icon+label nav
  items, active state tinted, role switch (customer ↔ admin) at the bottom, collapse toggle.
  Collapses automatically under 1040px width (`narrow`), and the whole layout goes single-column
  under 700px (`phone`) — mirror these two breakpoints.
- **TopBar** — breadcrumb (12px caption) + page title (27px, tracked tight), theme toggle,
  notification bell w/ unread badge, profile chip (initials avatar + name) on the right.
- **Keypad/PIN entry** — 4 dot indicators (filled when digit entered) + 3x4 numeric keypad
  (1-9, delete "⌫", 0, confirm "✓"), used both for initial PIN setup and the confirm-PIN modal.
- **Bottom sheet / centered modal** ("sheet") — generic form modal reused for Fund wallet,
  Transfer, Restock, and Balance-out/write-off, differing only by copy + fields (see `sheetCopy`
  in the spec) — build ONE component driven by a config object, not four separate modals.
- **Confirm dialog** — small centered modal, used for sign-out.
- **Toast** — bottom-center pill, dark bg, colored status dot, auto-dismiss (~2.6s).
- **Floating cart pill** — bottom-right floating button showing cart icon + count badge, expands
  to show item count + total once the cart has items. Hidden on landing/auth/pin-setup and while
  cart/viewer is open.
- **Product viewer / lightbox** — full-screen overlay, swipe (touch) or arrow-key navigation
  between products in the current filtered list, qty stepper, add-to-cart/view-cart CTA, dot
  pagination at the bottom.

## Screens (map 1:1 to existing routes in each repo — restyle, don't rename)

1. **Landing/marketing** — glass navbar (logo, theme toggle, sign in, create account), promo
   banner strip, hero (headline + subcopy + 2 CTAs + 3 stat callouts) beside a wallet-preview glass
   card with fake recent transactions.
2. **Auth (login/register)** — centered glass card, Google button, divider, name field (register
   only), email/password fields, inline error, submit CTA, swap link, back-to-home link.
3. **PIN setup** — centered glass card, 4 PIN dots, numeric keypad, save CTA.
4. **App shell** — sidebar (desktop) + top bar + main content, shared across all app screens below.
5. **Dashboard** — wallet hero gradient card (balance, tier/points, mask toggle, Fund/Transfer/Order
   actions) + loyalty progress card + month-spend bar chart card, "you order these often" product
   row, "recent activity" transaction table.
6. **Café/menu** — search + category chips, responsive product grid with stepper/add-to-cart.
7. **Transaction history** — filter chips (All/Funding/Purchase/Transfer/Reward) + full ledger table.
8. **Rewards** — tier card w/ progress bar + Bronze/Silver/Gold/Platinum scale + referral code
   card, points-earned list.
9. **Notifications** — mark-all-read action, list of glass notification rows (unread = tinted/bold).
10. **Profile** — identity card + read-only profile rows table, PIN-change-request card, account
    card (role switch + sign out).
11. **Admin home** — 4 stat cards (revenue/profit/low-stock/unreconciled) + console tile grid
    linking to the 6 admin sub-screens + export-reports/app-updates tiles.
12. **Inventory** — low-stock banner + stock value + "Add product" CTA + product table w/ per-row
    Restock action (opens the shared sheet modal).
13. **Sales logs** — date-range chips + 4 stat cards + orders table w/ per-row Refund action.
14. **Accounting** — 4 reconciliation stat cards + manual-override CTA + per-product
    sold/counted/expected/actual/variance table.
15. **Analytics** — revenue trend bar chart (14 days) + top-products progress bars + busiest-hours
    bar chart, top-customers list.
16. **Stock balance-out** — 4 stat cards + "Balance out stock" CTA (opens write-off sheet, PIN
    required) + stock ledger table w/ totals row + write-off history list.
17. **Users & access** — search + customer table w/ wallet/tier/status + per-row
    Activate/Deactivate + Promote/Demote actions.

Plus the floating overlays described above (cart drawer, viewer, PIN modal, generic sheet, confirm,
name-prompt, toast) which layer on top of any app screen.

## Responsive rules
- `phone`: viewport width < 700px — single column everywhere, smaller paddings/hero text, sidebar
  becomes icon-only/hidden per existing repo's mobile nav pattern.
- `narrow`: width < 1040px — two-column layouts collapse to one column, sidebar auto-collapses to
  the icon rail.
- Card/stat grids use `repeat(auto-fill/auto-fit, minmax(Npx, 1fr))` so column count is fluid.

## Web repo notes (`rad5-cafe`, React Router 7 + Tailwind v4 + TS)
- Extend `app/app.css` `@theme`/`:root` tokens (see above) instead of introducing a parallel system.
- Componentize under `app/components/` following existing folder conventions (`ui/`, `modals/`,
  feature folders). Add e.g. `app/components/ui/glass-panel.tsx`, `stat-card.tsx`,
  `data-table.tsx`, `pill-button.tsx`, `nav-rail.tsx`, `top-bar.tsx`, `pin-pad.tsx`,
  `action-sheet-modal.tsx` (the generic fund/transfer/restock/writeoff modal), `product-card.tsx`
  (already exists — restyle it), `product-viewer-modal.tsx` (rename/restyle
  `product-gallery-modal.tsx` if it already covers this), `cart-pill.tsx`.
- Keep existing contexts (`auth-context`, `cart-context`, `toast-context`, `confirm-context`,
  `notification-context`) as the state/behavior layer; only change presentation.
- Preserve existing routes not present in the demo (cash-orders, add-product, reports, updates,
  audit-logs, admin-pin-changes, expenses, manual-accounting) — restyle them with the same new
  primitives/tokens for visual consistency even though the prototype doesn't show them explicitly.

## Mobile repo notes (`rd-cafe`, Expo Router + RN 0.85 + TS)
- Add design tokens to `src/constants/theme.ts` (light/dark) mirroring the web tokens (converted to
  RN-usable values — blur handled via `expo-glass-effect`/`expo-blur`, not CSS `backdrop-filter`).
- Componentize under `src/components/` following existing conventions (`ui/`, feature folders).
  Add e.g. `src/components/ui/glass-panel.tsx`, `stat-card.tsx`, `pill-button.tsx`,
  `pin-pad.tsx`, `action-sheet-content.tsx` (generic, replacing the four near-duplicate
  `*-bottom-sheet-content.tsx` files where reasonable), `cart-pill.tsx`.
- Reuse `@gorhom/bottom-sheet` (already a dep) for the sheet/cart/PIN surfaces, styled with the new
  glass tokens.
- Keep existing contexts/hooks (`auth-context`, `cart-context`, `toast-context`, `confirm-context`,
  `notification-context`, `use-theme`) as the state layer; restyle screens under `src/app/**`.
- `(tabs)` = customer nav, `(admin-tabs)` = admin nav, `(sheets)` = modal routes, `(pages)` = detail
  screens, `(auth)` = auth flow — match the web's screen inventory above to these existing route
  groups; don't restructure navigation, just restyle within it and extract shared components.
