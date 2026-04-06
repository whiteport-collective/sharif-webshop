"use client"

import { useState, useTransition, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import TireSearch, { type TireSearchParams } from "@modules/home/components/tire-search"
import TireCard from "@modules/products/components/tire-card"
import TireCarousel from "@modules/products/components/tire-carousel"
import TireResultsHeader, { type SortKey } from "@modules/products/components/tire-results-header"
import QuantityAndShop, { type SelectedTire } from "@modules/home/components/quantity-shop"
import ProductDetailPanel from "@modules/products/components/product-detail-panel"
import { sortProducts } from "@lib/util/sort-tires"
import { searchTires } from "../../../../app/actions/search-tires"
import { addToCart, deleteLineItem, retrieveCart } from "@lib/data/cart"
import CheckoutPanelContent from "@modules/checkout/components/checkout-panel-content"
import { LanguageContext, UI, type Lang } from "@lib/i18n"

type SearchMeta = {
  dimension: string
  qty: number
  season: string
  seasonLabel: string
}

function TireCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-ui-border-base bg-ui-bg-base overflow-hidden animate-pulse">
      <div className="aspect-square w-full bg-gray-100" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-full rounded bg-gray-100" />
        </div>
        <div className="mt-2 h-6 w-1/3 rounded bg-gray-200" />
        <div className="h-5 w-1/4 rounded-full bg-gray-100" />
      </div>
      <div className="mx-4 mb-4 mt-auto h-11 rounded-lg bg-gray-200" />
    </div>
  )
}

export default function FlowShell({
  availableDimensions,
  dimensionCounts,
  countryCode,
  region,
  cartBadge,
  landingContent,
}: {
  availableDimensions: string[]
  dimensionCounts: Record<string, number>
  countryCode: string
  region: HttpTypes.StoreRegion
  cartBadge: React.ReactNode
  landingContent: React.ReactNode
}) {
  const [view, setView] = useState<"home" | "results" | "quantity-shop" | "checkout">("home")
  const [lang, setLang] = useState<Lang>("no")
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [activeSort, setActiveSort] = useState<SortKey>("price")
  const [menuOpen, setMenuOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [hideBack, setHideBack] = useState(false)
  const [searchMeta, setSearchMeta] = useState<SearchMeta>({
    dimension: "",
    qty: 4,
    season: "sommer",
    seasonLabel: "",
  })
  const [selectedTire, setSelectedTire] = useState<SelectedTire | null>(null)
  const [detailProduct, setDetailProduct] = useState<HttpTypes.StoreProduct | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewDimension, setPreviewDimension] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(6)
  const [checkoutKey, setCheckoutKey] = useState(0)
  const [cartLoading, setCartLoading] = useState(false)
  const [checkoutStepTitle, setCheckoutStepTitle] = useState("")
  const checkoutBackRef = useRef<(() => void) | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const t = UI[lang]

  const prefetchCache = useRef<Map<string, HttpTypes.StoreProduct[]>>(new Map())
  const prefetchInFlight = useRef<Set<string>>(new Set())
  const resultsRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const qtyShopRef = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const backLocked = useRef(false)
  const pendingParams = useRef<TireSearchParams | null>(null)
  const selectedTireRef = useRef<SelectedTire | null>(null)

  // Keep selectedTireRef in sync for popstate closures
  const syncSelectedTire = useCallback((tire: SelectedTire | null) => {
    selectedTireRef.current = tire
    setSelectedTire(tire)
  }, [])

  // Run a search and transition to results view — used both by user interaction
  // and by the URL-restore path on mount.
  const runSearch = useCallback((params: TireSearchParams, pushHistory: boolean) => {
    const dimension = `${params.width}/${params.profile}R${params.rim}`
    const qty = Number(params.qty) || 4
    const season = params.season || "sommer"
    const currentT = UI[lang]
    const seasonLabel =
      season === "sommer" ? currentT.summerTires :
      season === "vinter-piggfritt" ? currentT.winterStudless :
      season === "vinter-piggdekk" ? currentT.winterStudded :
      season.charAt(0).toUpperCase() + season.slice(1)
    const nextMeta: SearchMeta = { dimension, qty, season, seasonLabel }

    setSearchMeta(nextMeta)
    setActiveSort("price")
    setVisibleLimit(6)
    setView("results")

    if (pushHistory) {
      // pushState with a real query string — readable, shareable URL.
      // We use pushState (not router.push) so Next.js App Router does NOT
      // intercept the URL change and re-render the server component.
      const qs = new URLSearchParams({
        w: params.width,
        p: params.profile,
        r: params.rim,
        qty: String(qty),
        season,
      }).toString()
      window.history.pushState({ flowView: "results" }, "", `?${qs}`)
    }

    const cached = prefetchCache.current.get(dimension)
    if (cached) {
      setProducts(cached)
      setIsLoading(false)
    } else {
      setProducts([])
      setIsLoading(true)
      startTransition(async () => {
        const result = await searchTires(countryCode, params.width, params.profile, params.rim)
        prefetchCache.current.set(dimension, result.products)
        setProducts(result.products)
        setIsLoading(false)
      })
    }
  }, [countryCode, lang])

  const handleSelectTire = useCallback((product: HttpTypes.StoreProduct, qty: number) => {
    const variant = (product.variants?.[0] ?? {}) as any

    // If already in cart, open checkout panel directly — no loading needed
    const existing = selectedTireRef.current
    if (existing?.lineItemId && existing.product.variants?.[0]?.id === variant.id) {
      setCheckoutKey((k) => k + 1)
      setView("checkout")
      return
    }

    const unitPrice = variant?.calculated_price?.calculated_amount ?? 0
    const currencyCode = variant?.calculated_price?.currency_code ?? region.currency_code ?? "NOK"
    const tire: SelectedTire = { product, initialQty: qty, unitPrice, currencyCode }
    syncSelectedTire(tire)

    // Open checkout immediately — panel shows skeleton while cart op runs in background
    if (variant?.id) {
      setCartLoading(true)
      setCheckoutKey((k) => k + 1)
      setView("checkout")
      startTransition(async () => {
        try {
          const currentCart = await retrieveCart()
          const alreadyInCart = currentCart?.items?.some(
            (item: any) => item.variant_id === variant.id
          )
          if (!alreadyInCart) {
            await addToCart({ variantId: variant.id, quantity: qty, countryCode })
          }
        } catch {
          // ignore — checkout will fetch fresh cart and show what's there
        }
        setCartLoading(false)
        router.refresh() // re-validate server CartButton so badge shows correct count
      })
    }
  }, [region.currency_code, syncSelectedTire, countryCode, router])

  // Trash tap — removes from cart and clears selection
  const handleRemoveTire = useCallback(() => {
    const lineItemId = selectedTireRef.current?.lineItemId
    syncSelectedTire(null)
    if (lineItemId) {
      startTransition(async () => {
        await deleteLineItem(lineItemId)
        router.refresh()
      })
    }
  }, [syncSelectedTire, router])

  // On mount: restore state from URL (shareability) and set up history/gesture listeners.
  useEffect(() => {
    // Restore from URL if dimension params are present (shared link / bookmark)
    const urlParams = new URLSearchParams(window.location.search)
    const w = urlParams.get("w")
    const p = urlParams.get("p")
    const r = urlParams.get("r")
    if (w && p && r) {
      runSearch({
        width: w,
        profile: p,
        rim: r,
        qty: urlParams.get("qty") || "4",
        season: urlParams.get("season") || "sommer",
      }, false) // don't push — URL already correct
      // Tag this entry as results so popstate knows the state
      window.history.replaceState({ flowView: "results" }, "", window.location.href)
    } else {
      // Tag the home entry
      window.history.replaceState({ flowView: "home" }, "", window.location.href)
    }

    // Intercept popstate in the capture phase — fires before Next.js's own listener,
    // letting us handle flow navigation without triggering a server re-render.
    const onPopState = (e: PopStateEvent) => {
      const flowView = e.state?.flowView
      if (flowView === "home") {
        e.stopImmediatePropagation()
        setView("home")
      } else if (flowView === "results") {
        e.stopImmediatePropagation()
        // Restore search state from the URL we pushed
        const params = new URLSearchParams(window.location.search)
        const w = params.get("w"), p = params.get("p"), r = params.get("r")
        if (w && p && r) {
          runSearch({ width: w, profile: p, rim: r, qty: params.get("qty") || "4", season: params.get("season") || "sommer" }, false)
        }
      } else if (flowView === "quantity-shop") {
        e.stopImmediatePropagation()
        if (selectedTireRef.current) {
          setView("quantity-shop")
        } else {
          setView("results")
        }
      } else if (flowView === "checkout") {
        e.stopImmediatePropagation()
        setView("checkout")
      }
    }

    window.addEventListener("popstate", onPopState, true) // capture phase
    return () => window.removeEventListener("popstate", onPopState, true)
  }, [runSearch])

  // Swipe-down and scroll-down to advance — only when home panel is at bottom and form is complete
  useEffect(() => {
    const el = homeRef.current
    if (!el || view !== "home") return

    const atBottom = () => el.scrollHeight - el.scrollTop - el.clientHeight < 8

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!atBottom() || !pendingParams.current) return
      const dy = touchStartY.current - e.touches[0].clientY // negative = swipe down
      if (dy > 60) {
        runSearch(pendingParams.current, true)
      }
    }

    const onWheel = (e: WheelEvent) => {
      if (atBottom() && e.deltaY > 20 && pendingParams.current) {
        runSearch(pendingParams.current, true)
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("wheel", onWheel, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("wheel", onWheel)
    }
  }, [view, runSearch])

  const triggerBack = () => {
    if (backLocked.current) return
    backLocked.current = true
    setTimeout(() => { backLocked.current = false }, 600)
    window.history.back()
  }

  // Swipe-up to go back — quantity-shop panel, at top of scroll
  useEffect(() => {
    const el = qtyShopRef.current
    if (!el || view !== "quantity-shop") return

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop > 0) return
      if (e.touches[0].clientY - touchStartY.current > 60) triggerBack()
    }

    const onWheel = (e: WheelEvent) => {
      if (el.scrollTop === 0 && e.deltaY < -40) triggerBack()
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("wheel", onWheel, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("wheel", onWheel)
    }
  }, [view])

  // Scroll-up at top of results → back to home
  useEffect(() => {
    const el = resultsRef.current
    if (!el || view !== "results") return

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop > 0) return
      if (e.touches[0].clientY - touchStartY.current > 60) triggerBack()
    }

    const onWheel = (e: WheelEvent) => {
      if (el.scrollTop === 0 && e.deltaY < -40) triggerBack()
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("wheel", onWheel, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("wheel", onWheel)
    }
  }, [view])

  useEffect(() => {
    if (!langMenuOpen) return
    const close = (e: MouseEvent) => {
      if (langMenuRef.current?.contains(e.target as Node)) return
      setLangMenuOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [langMenuOpen])

  const handleDimensionChange = useCallback((dimension: string | null) => {
    setPreviewDimension(dimension)
    if (!dimension) return
    if (prefetchCache.current.has(dimension)) return
    if (prefetchInFlight.current.has(dimension)) return

    prefetchInFlight.current.add(dimension)
    const [widthPart, rest] = dimension.split("/")
    const [profilePart, rimPart] = rest.split("R")

    startTransition(async () => {
      const result = await searchTires(countryCode, widthPart, profilePart, rimPart)
      prefetchCache.current.set(dimension, result.products)
      prefetchInFlight.current.delete(dimension)
    })
  }, [countryCode])

  const knownCount = dimensionCounts[searchMeta.dimension] ?? 0

  function handleSearch(params: TireSearchParams) {
    runSearch(params, true)
  }

  function handleBack() {
    window.history.back()
  }

  function handleSortChange(key: SortKey) {
    setActiveSort(key)
  }

  const sorted = sortProducts(products, activeSort)
  const displayCount = isLoading ? knownCount : products.length
  const skeletonCount = Math.min(knownCount || 4, 8)

  const handleHeaderBack = () => {
    if (view === "checkout") {
      checkoutBackRef.current?.()
    } else {
      triggerBack()
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: UI[lang] }}>
    <div className="relative h-screen overflow-hidden bg-ui-bg-base">

      {/* ─── Persistent header — always on top, all panels slide behind it ─── */}
      <div className="absolute inset-x-0 top-0 z-[60] h-14 bg-white border-b border-ui-border-base flex items-center px-3 gap-2">
        {/* Left — menu (home) or back arrow (all other views) + logo + results summary */}
        <div className="flex items-center gap-2 flex-1">
          {view === "home" ? (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
              aria-label="Meny"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <rect y="0" width="16" height="2" rx="1" fill="currentColor" />
                <rect y="5" width="16" height="2" rx="1" fill="currentColor" />
                <rect y="10" width="16" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          ) : hideBack ? null : (
            <button
              type="button"
              onClick={handleHeaderBack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
              aria-label="Tilbake"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <img src="/sharif-logo.svg" alt="Sharif" className="h-7 w-auto" />
          {(view === "results" || view === "quantity-shop") && searchMeta.dimension && (
            <>
              <span className="text-xs text-ui-fg-subtle font-medium">
                {searchMeta.dimension} · {searchMeta.qty} stk · {searchMeta.seasonLabel}
              </span>
              <button
                type="button"
                onClick={() => setView("home")}
                className="text-xs text-ui-fg-muted underline ml-1 hover:text-ui-fg-base"
              >
                Endre
              </button>
            </>
          )}
        </div>

        {/* Center — step title (absolute centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          {(view === "results" || view === "quantity-shop") && (
            <span className="text-sm font-semibold text-ui-fg-base">{t.stepResults}</span>
          )}
          {view === "checkout" && checkoutStepTitle && (
            <span className="text-sm font-semibold text-ui-fg-base">{checkoutStepTitle}</span>
          )}
        </div>

        {/* Right — support + language + cart */}
        <div className="flex-none flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSupportOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
            aria-label={t.callUs}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .9h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </button>
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-lg hover:bg-ui-bg-subtle transition-colors"
              aria-label="Velg språk"
            >
              {lang === "no" ? "🇳🇴" : "🇬🇧"}
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 rounded-xl border border-ui-border-base bg-white shadow-lg overflow-hidden z-[70]">
                <button
                  type="button"
                  onClick={() => { setLang("no"); setLangMenuOpen(false) }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-ui-bg-subtle ${lang === "no" ? "font-semibold" : ""}`}
                >
                  🇳🇴 Norsk
                </button>
                <button
                  type="button"
                  onClick={() => { setLang("en"); setLangMenuOpen(false) }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-ui-bg-subtle ${lang === "en" ? "font-semibold" : ""}`}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>
          {cartBadge}
        </div>
      </div>

      {/* ─── Menu panel — slide down from header ─── */}
      {menuOpen && (
        <div className="absolute inset-x-0 top-14 z-50 bg-white border-b border-ui-border-base shadow-md p-4 flex items-center justify-between">
          <a
            href="tel:+4793485790"
            className="text-sm font-medium text-ui-fg-base hover:underline"
          >
            Ring oss
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-bg-subtle text-ui-fg-base"
          >
            ×
          </button>
        </div>
      )}

      {/* ─── HOME PANEL — slides up on search ─── */}
      <div
        ref={homeRef}
        className={`absolute inset-0 overflow-y-auto pt-14 transition-transform duration-500 ease-in-out ${
          view === "home" ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >

        <div className="flex min-h-[calc(70vh-3.5rem)] items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <h1 className="mb-3 text-center text-4xl font-bold md:text-5xl">
              {t.homeTitle}
            </h1>
            <p className="mb-8 text-center text-ui-fg-subtle">
              {t.homeSubtitle}
            </p>
            <TireSearch
              availableDimensions={availableDimensions}
              dimensionCounts={dimensionCounts}
              onSearch={handleSearch}
              onDimensionChange={handleDimensionChange}
              onFormChange={(params) => { pendingParams.current = params }}
              previewCount={previewDimension ? dimensionCounts[previewDimension] : undefined}
            />
          </div>
        </div>

        {landingContent}
      </div>

      {/* ─── RESULTS PANEL — rises up from below, slides off top when qty-shop opens ─── */}
      <div
        ref={resultsRef}
        className={`absolute inset-0 overflow-y-auto pt-14 transition-transform duration-500 ease-in-out ${
          view === "results"
            ? "translate-y-0"
            : view === "quantity-shop" || view === "checkout"
              ? "-translate-y-full pointer-events-none"
              : "translate-y-full pointer-events-none"
        }`}
      >
        {!isLoading && products.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-lg text-ui-fg-base">
              {t.noResults(searchMeta.dimension)}
            </p>
            <p className="mt-2 text-sm text-ui-fg-subtle">
              {t.noResultsHint}{" "}
              <a href="tel:+4793485790" className="font-medium underline">
                +47 934 85 790
              </a>
              .
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-6 inline-block rounded-lg bg-ui-button-neutral px-5 py-2.5 text-sm font-medium text-ui-button-neutral-fg hover:bg-ui-button-neutral-hover"
            >
              {t.changeSize}
            </button>
          </div>
        ) : (
          <>
            <TireResultsHeader
              count={displayCount}
              activeSort={activeSort}
              onSortChange={handleSortChange}
            />

            {/* Mobile — 2-column grid */}
            <div className="md:hidden px-3 pb-8">
              <div className="grid grid-cols-2 gap-3">
                {isLoading
                  ? Array.from({ length: skeletonCount }).map((_, i) => (
                      <TireCardSkeleton key={i} />
                    ))
                  : sorted.slice(0, visibleLimit).map((product) => (
                      <TireCard
                        key={product.id}
                        product={product}
                        region={region}
                        qty={searchMeta.qty}
                        isInCart={selectedTire?.product.id === product.id}
                        onSelectTire={handleSelectTire}
                        onRemoveTire={handleRemoveTire}
                        onProductDetail={setDetailProduct}
                      />
                    ))}
              </div>
              {!isLoading && sorted.length > visibleLimit && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((n) => n + 6)}
                    className="rounded-lg border border-ui-border-base bg-ui-bg-base px-6 py-2.5 text-sm font-medium text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
                  >
                    {t.showMore(sorted.length - visibleLimit)}
                  </button>
                </div>
              )}
            </div>

            {/* Tablet+ — 3/4-column grid with "Vis fler" */}
            <div className="hidden md:block md:px-4 md:pb-8">
              <div className="md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {isLoading
                  ? Array.from({ length: skeletonCount }).map((_, i) => (
                      <TireCardSkeleton key={i} />
                    ))
                  : sorted.slice(0, visibleLimit).map((product) => (
                      <TireCard
                        key={product.id}
                        product={product}
                        region={region}
                        qty={searchMeta.qty}
                        isInCart={selectedTire?.product.id === product.id}
                        onSelectTire={handleSelectTire}
                        onRemoveTire={handleRemoveTire}
                        onProductDetail={setDetailProduct}
                      />
                    ))}
              </div>

              {!isLoading && sorted.length > visibleLimit && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((n) => n + 6)}
                    className="rounded-lg border border-ui-border-base bg-ui-bg-base px-6 py-2.5 text-sm font-medium text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
                  >
                    {t.showMore(sorted.length - visibleLimit)}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── QUANTITY-SHOP PANEL — rises from below when product selected ─── */}
      <div
        ref={qtyShopRef}
        className={`absolute inset-0 overflow-y-auto pt-14 transition-transform duration-500 ease-in-out ${
          view === "quantity-shop" ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
      >
        {selectedTire && (
          <QuantityAndShop
            tire={selectedTire}
            countryCode={countryCode}
            onBack={handleBack}
          />
        )}
      </div>

      {/* ─── CHECKOUT PANEL — rises from below when tire is added to cart ─── */}
      <div
        ref={checkoutRef}
        className={`absolute inset-0 pt-14 transition-transform duration-500 ease-in-out ${
          view === "checkout" ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
      >
        {checkoutKey > 0 && (
          <CheckoutPanelContent
            key={checkoutKey}
            countryCode={countryCode}
            cartLoading={cartLoading}
            supportOpen={supportOpen}
            onStepTitle={setCheckoutStepTitle}
            onRegisterBack={(fn) => { checkoutBackRef.current = fn }}
            onBack={() => {
              backLocked.current = true
              setTimeout(() => { backLocked.current = false }, 600)
              setView("results")
            }}
            onConfirmationReached={() => {
              setHideBack(true)
              setCheckoutStepTitle("")
            }}
          />
        )}
      </div>

      {/* ─── PRODUCT DETAIL PANEL — drawer on mobile, modal on desktop ─── */}
      {detailProduct && (
        <ProductDetailPanel
          product={detailProduct}
          region={region}
          qty={searchMeta.qty}
          onClose={() => setDetailProduct(null)}
          onSelect={(product, qty) => {
            setDetailProduct(null)
            handleSelectTire(product, qty)
          }}
        />
      )}

      {/* ─── SUPPORT SIDEBAR ─── */}
      <aside className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-ui-border-base shadow-xl z-[80] flex flex-col transition-transform duration-300 ease-in-out ${supportOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-ui-border-base">
          <span className="font-semibold text-sm">Support</span>
          <button
            type="button"
            onClick={() => setSupportOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-bg-subtle"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* TODO: when supportOpen is true and checkout is in confirmation step, AI chat moves here */}
          <p className="text-sm text-ui-fg-subtle">Har du spørsmål? Chat med oss.</p>
          <a
            href="tel:+4793485790"
            className="mt-4 block text-sm font-medium text-ui-fg-base hover:underline"
          >
            Ring oss: +47 934 85 790
          </a>
        </div>
      </aside>

    </div>
    </LanguageContext.Provider>
  )
}
