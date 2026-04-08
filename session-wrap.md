## Learned
- Next.js middleware rewrites (not redirects) keep clean URLs in the browser while internally routing to `[countryCode]` paths. Sharif is Norway-only so `/no/` should never be visible.
- `usePathname()` returns the original browser URL with rewrites, not the rewritten path. NavController segment checks must handle both `/dekk/...` and `/no/dekk/...`.
- The FlowShell header dimension chip was repeatedly gated on `activeSection` scroll state, causing it to vanish when scrolling up. The rule: dimension chip visibility must ONLY depend on search state (`searchMeta.dimension` + `products.length > 0`), never on scroll position.
- Puppeteer `setNativeValue` hack bypasses React state — unreliable for testing controlled inputs. Use direct URL navigation for proper React state testing.

## Context
Implemented virtual URL routing for the Sharif storefront:
- **Middleware** (`storefront/src/middleware.ts`): Rewrites all clean URLs to `/no/...` internally. No more 307 redirects. `/dekk/*`, `/`, and all other paths work without `/no/` visible.
- **Dekk route** (`storefront/src/app/[countryCode]/(main)/dekk/[[...slug]]/page.tsx`): Optional catch-all that parses `/dekk/205-55R16/sommer/4` into search params and renders FlowShell with `initialSearch` prop.
- **FlowShell** (`storefront/src/modules/home/components/flow-shell/index.tsx`): Uses `/dekk/` URLs in history.pushState. Added `initialSearch`, `landingFooter`, `resetSearchRef` props. Split landing content into always-visible (value props) and pre-search-only (brands/workshops).
- **NavController**: Hides Medusa nav on `/dekk/` pages.
- **Header dimension chip**: Shows after products load, persists across all sections. "Ta bort" on home clears search + inputs. "Endre" on results/checkout scrolls back.

**Known issue**: The header has sloppy conditional logic — left icon (hamburger vs back) and action button (Ta bort vs Endre) both swap based on `activeSection` scroll state, causing blinks at section boundaries. Needs a clean rewrite.

## Plan
Complete storefront order flow for Moohsen demo. URL routing done. Next: fix the header to be stable (no scroll-dependent swaps), then remaining feedback items: FB-22 (language change scroll), FB-23 (order confirmation), FB-24 (home delivery button label).

## Next
Rewrite the FlowShell header dimension area in `storefront/src/modules/home/components/flow-shell/index.tsx:457-515`. Remove all `activeSection`-based conditionals from the dimension chip and action buttons. The header should be one stable bar: logo + dimension chip (when search active) + "Endre" link (always scrolls to search form) + small x icon to clear search. The left icon (hamburger/back) should also not blink — use the back arrow whenever results exist, hamburger only on clean home state (no `searchMeta.dimension`).

## Spec Sync
None
