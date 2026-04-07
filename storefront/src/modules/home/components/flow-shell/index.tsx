"use client"

import { useState, useTransition, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import TireSearch, { type TireSearchParams } from "@modules/home/components/tire-search"
import TireCard from "@modules/products/components/tire-card"
import TireResultsHeader, { type SortKey } from "@modules/products/components/tire-results-header"
import { type SelectedTire } from "@modules/home/components/quantity-shop"
import ProductDetailPanel from "@modules/products/components/product-detail-panel"
import { sortProducts } from "@lib/util/sort-tires"
import { searchTires } from "../../../../app/actions/search-tires"
import { addToCart, deleteLineItem, retrieveCart } from "@lib/data/cart"
import CheckoutPanelContent from "@modules/checkout/components/checkout-panel-content"
import { LanguageContext, UI, type Lang } from "@lib/i18n"
import { AgentToolContextProvider, type AgentToolHandlers } from "@modules/home/components/agent-panel/AgentToolContext"
import AgentPanel from "@modules/home/components/agent-panel"

type SearchMeta = {
  dimension: string
  qty: number
  season: string
  seasonLabel: string
}

type FlowView = "home" | "results" | "checkout"

function TireCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base animate-pulse">
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
  const [view, setView] = useState<FlowView>("home")
  const [activeSection, setActiveSection] = useState<FlowView>("home")
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
  const setDimensionRef = useRef<((w: string, p: string, r: string) => void) | null>(null)
  const agentPrefillRef = useRef<((field: string, value: string) => void) | null>(null)
  const agentOpenPaymentRef = useRef<(() => void) | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const t = UI[lang]

  const prefetchCache = useRef<Map<string, HttpTypes.StoreProduct[]>>(new Map())
  const prefetchInFlight = useRef<Set<string>>(new Set())
  const surfaceRef = useRef<HTMLDivElement>(null)
  const homeSectionRef = useRef<HTMLDivElement>(null)
  const resultsSectionRef = useRef<HTMLDivElement>(null)
  const checkoutSectionRef = useRef<HTMLDivElement>(null)
  const backLocked = useRef(false)
  const pendingParams = useRef<TireSearchParams | null>(null)
  const selectedTireRef = useRef<SelectedTire | null>(null)

  const syncSelectedTire = useCallback((tire: SelectedTire | null) => {
    selectedTireRef.current = tire
    setSelectedTire(tire)
  }, [])

  const scrollToSection = useCallback((targetView: FlowView, behavior: ScrollBehavior = "smooth") => {
    const surface = surfaceRef.current
    if (!surface) return

    const target =
      targetView === "home"
        ? homeSectionRef.current
        : targetView === "results"
          ? resultsSectionRef.current
          : checkoutSectionRef.current

    if (!target) return

    surface.scrollTo({
      top: Math.max(0, target.offsetTop - 56),
      behavior,
    })
  }, [])

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

    setHideBack(false)
    setSearchMeta({ dimension, qty, season, seasonLabel })
    setActiveSort("price")
    setVisibleLimit(6)
    setView("results")

    if (pushHistory) {
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
      return
    }

    setProducts([])
    setIsLoading(true)
    startTransition(async () => {
      const result = await searchTires(countryCode, params.width, params.profile, params.rim)
      prefetchCache.current.set(dimension, result.products)
      setProducts(result.products)
      setIsLoading(false)
    })
  }, [countryCode, lang])

  const openCheckoutPanel = useCallback(() => {
    if (backLocked.current || !selectedTireRef.current) return

    backLocked.current = true
    setTimeout(() => { backLocked.current = false }, 600)
    setHideBack(false)
    setCheckoutKey((current) => current || 1)
    window.history.pushState({ flowView: "checkout" }, "", window.location.href)
    setView("checkout")
  }, [])

  const handleSelectTire = useCallback((product: HttpTypes.StoreProduct, qty: number) => {
    const variant = (product.variants?.[0] ?? {}) as any
    const existing = selectedTireRef.current

    if (existing?.lineItemId && existing.product.variants?.[0]?.id === variant.id) {
      setHideBack(false)
      setCheckoutKey((current) => current + 1)
      window.history.pushState({ flowView: "checkout" }, "", window.location.href)
      setView("checkout")
      return
    }

    const unitPrice = variant?.calculated_price?.calculated_amount ?? 0
    const currencyCode = variant?.calculated_price?.currency_code ?? region.currency_code ?? "NOK"
    syncSelectedTire({ product, initialQty: qty, unitPrice, currencyCode })

    if (!variant?.id) return

    setHideBack(false)
    setCartLoading(true)
    setCheckoutKey((current) => current + 1)
    window.history.pushState({ flowView: "checkout" }, "", window.location.href)
    setView("checkout")

    startTransition(async () => {
      try {
        const currentCart = await retrieveCart()
        const alreadyInCart = currentCart?.items?.some((item: any) => item.variant_id === variant.id)
        if (!alreadyInCart) {
          await addToCart({ variantId: variant.id, quantity: qty, countryCode })
        }
      } catch {
        // Checkout fetches fresh cart data and can recover on its own.
      }

      setCartLoading(false)
      router.refresh()
    })
  }, [countryCode, region.currency_code, router, syncSelectedTire])

  const handleRemoveTire = useCallback(() => {
    const lineItemId = selectedTireRef.current?.lineItemId
    syncSelectedTire(null)
    if (view === "checkout") {
      setView("results")
    }
    if (!lineItemId) return

    startTransition(async () => {
      await deleteLineItem(lineItemId)
      router.refresh()
    })
  }, [router, syncSelectedTire, view])

  useEffect(() => {
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
      }, false)
      window.history.replaceState({ flowView: "results" }, "", window.location.href)
    } else {
      window.history.replaceState({ flowView: "home" }, "", window.location.href)
    }

    const onPopState = (e: PopStateEvent) => {
      const flowView = e.state?.flowView as FlowView | undefined

      if (flowView === "home") {
        e.stopImmediatePropagation()
        setActiveSection("home")
        setView("home")
        return
      }

      if (flowView === "results") {
        e.stopImmediatePropagation()
        const params = new URLSearchParams(window.location.search)
        const width = params.get("w")
        const profile = params.get("p")
        const rim = params.get("r")

        if (width && profile && rim) {
          runSearch({
            width,
            profile,
            rim,
            qty: params.get("qty") || "4",
            season: params.get("season") || "sommer",
          }, false)
        } else {
          setActiveSection("results")
          setView("results")
        }
        return
      }

      if (flowView === "checkout") {
        e.stopImmediatePropagation()
        const nextView = selectedTireRef.current ? "checkout" : "results"
        setActiveSection(nextView)
        setView(nextView)
      }
    }

    window.addEventListener("popstate", onPopState, true)
    return () => window.removeEventListener("popstate", onPopState, true)
  }, [runSearch])

  useEffect(() => {
    if (!langMenuOpen) return

    const close = (e: MouseEvent) => {
      if (langMenuRef.current?.contains(e.target as Node)) return
      setLangMenuOpen(false)
    }

    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [langMenuOpen])

  const showResultsSection = Boolean(searchMeta.dimension)
  const showCheckoutSection = Boolean(selectedTire) && checkoutKey > 0

  useEffect(() => {
    if (view === "results" && !showResultsSection) return
    if (view === "checkout" && !showCheckoutSection) return

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(view, view === "home" ? "auto" : "smooth")
    })

    return () => window.cancelAnimationFrame(frame)
  }, [view, scrollToSection, showCheckoutSection, showResultsSection])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    const syncActiveSection = () => {
      const scrollMarker = surface.scrollTop + 120
      const resultsTop = showResultsSection ? (resultsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY
      const checkoutTop = showCheckoutSection ? (checkoutSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY

      const nextSection =
        scrollMarker >= checkoutTop
          ? "checkout"
          : scrollMarker >= resultsTop
            ? "results"
            : "home"

      setActiveSection((current) => current === nextSection ? current : nextSection)
    }

    syncActiveSection()
    surface.addEventListener("scroll", syncActiveSection, { passive: true })
    return () => surface.removeEventListener("scroll", syncActiveSection)
  }, [showCheckoutSection, showResultsSection])

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
    if (backLocked.current) return
    backLocked.current = true
    setTimeout(() => { backLocked.current = false }, 600)
    window.history.back()
  }

  function handleSortChange(key: SortKey) {
    setActiveSort(key)
  }

  const sorted = sortProducts(products, activeSort)
  const displayCount = isLoading ? knownCount : products.length
  const skeletonCount = Math.min(knownCount || 4, 8)
  const hasMoreResults = !isLoading && sorted.length > visibleLimit
  const showCheckoutAction = !isLoading && Boolean(selectedTire)
  const showResultsActions = hasMoreResults || showCheckoutAction

  const agentHandlers: AgentToolHandlers = {
    fillDimensionField: (width, profile, rim) => {
      setDimensionRef.current?.(String(width), String(profile), String(rim))
    },
    triggerSearch: () => {
      if (pendingParams.current) runSearch(pendingParams.current, true)
    },
    selectTire: (productId) => {
      const product = products.find((p) => p.id === productId)
      if (product) handleSelectTire(product, searchMeta.qty)
    },
    scrollToProduct: (productId) => {
      const el = document.querySelector(`[data-product-id="${productId}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    prefillCheckoutField: (field, value) => {
      agentPrefillRef.current?.(field, value)
    },
    openPaymentStep: () => {
      agentOpenPaymentRef.current?.()
    },
  }

  const getSessionContext = useCallback(() => ({
    view: activeSection,
    dimension: searchMeta.dimension || null,
    visibleProductIds: products.map((p) => p.id ?? ""),
    cartItems: selectedTire
      ? [{ productId: selectedTire.product.id ?? "", qty: selectedTire.initialQty }]
      : [],
    step: activeSection === "checkout" ? checkoutStepTitle || null : null,
  }), [activeSection, searchMeta.dimension, products, selectedTire, checkoutStepTitle])

  const handleHeaderBack = () => {
    if (activeSection === "checkout") {
      checkoutBackRef.current?.()
      return
    }
    handleBack()
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <AgentToolContextProvider handlers={agentHandlers}>
        <div className="relative h-screen overflow-hidden bg-ui-bg-base">
          <div className="absolute inset-x-0 top-0 z-[60] flex h-14 items-center gap-2 border-b border-ui-border-base bg-white px-3">
            <div className="flex flex-1 items-center gap-2">
              {activeSection === "home" ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
                  aria-label="Tilbake"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <img src="/sharif-logo.png" alt="Sharif" className="h-7 w-auto" />
              {(activeSection === "results" || activeSection === "checkout") && searchMeta.dimension && (
                <>
                  <span className="text-xs font-medium text-ui-fg-subtle">
                    {searchMeta.dimension} · {searchMeta.qty} stk · {searchMeta.seasonLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="ml-1 text-xs text-ui-fg-muted underline hover:text-ui-fg-base"
                  >
                    Endre
                  </button>
                </>
              )}
            </div>

            <div className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center">
              {activeSection === "results" && (
                <span className="text-sm font-semibold text-ui-fg-base">{t.stepResults}</span>
              )}
              {activeSection === "checkout" && checkoutStepTitle && (
                <span className="text-sm font-semibold text-ui-fg-base">{checkoutStepTitle}</span>
              )}
            </div>

            <div className="flex-none flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSupportOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
                aria-label={t.callUs}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .9h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </button>
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-lg transition-colors hover:bg-ui-bg-subtle"
                  aria-label="Velg språk"
                >
                  {lang === "no" ? "🇳🇴" : "🇬🇧"}
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 top-full z-[70] mt-1 w-32 overflow-hidden rounded-xl border border-ui-border-base bg-white shadow-lg">
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

          {menuOpen && (
            <div className="absolute inset-x-0 top-14 z-50 flex items-center justify-between border-b border-ui-border-base bg-white p-4 shadow-md">
              <a href="tel:+4793485790" className="text-sm font-medium text-ui-fg-base hover:underline">
                Ring oss
              </a>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ui-fg-base hover:bg-ui-bg-subtle"
              >
                ×
              </button>
            </div>
          )}

          <div
            ref={surfaceRef}
            className="absolute inset-0 overflow-y-auto scroll-smooth snap-y snap-mandatory"
            style={{ scrollPaddingTop: "56px", overscrollBehaviorY: "contain", scrollbarGutter: "stable" as any }}
          >
            <section
              ref={homeSectionRef}
              className="min-h-screen snap-start bg-ui-bg-base pt-14"
              style={{ scrollSnapStop: "always" }}
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
                    onMount={(fn) => { setDimensionRef.current = fn }}
                  />
                </div>
              </div>

              {!showResultsSection && landingContent}
            </section>

            {showResultsSection && (
              <section
                ref={resultsSectionRef}
                className="min-h-screen snap-start border-t border-ui-border-base bg-ui-bg-base pt-14"
                style={{ scrollSnapStop: "always" }}
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

                    <div className="px-3 pb-8 md:hidden">
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
                    </div>

                    <div className="hidden px-4 pb-8 md:block">
                      <div className="grid grid-cols-3 gap-4 lg:grid-cols-4">
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
                    </div>

                    {showResultsActions && (
                      <div className="px-3 pb-12 md:px-4">
                        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
                          {hasMoreResults && (
                            <button
                              type="button"
                              onClick={() => setVisibleLimit((current) => current + 6)}
                              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-base px-6 py-2.5 text-sm font-medium text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
                            >
                              {t.showMore(sorted.length - visibleLimit)}
                            </button>
                          )}
                          {showCheckoutAction && (
                            <button
                              type="button"
                              onClick={openCheckoutPanel}
                              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                            >
                              {t.proceedToCheckout}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {showCheckoutSection && (
              <section
                ref={checkoutSectionRef}
                className="min-h-screen snap-start border-t border-ui-border-base bg-ui-bg-base pt-14"
                style={{ scrollSnapStop: "always" }}
              >
                <CheckoutPanelContent
                  key={checkoutKey}
                  countryCode={countryCode}
                  embedded
                  isActive={activeSection === "checkout"}
                  cartLoading={cartLoading}
                  supportOpen={supportOpen}
                  onStepTitle={setCheckoutStepTitle}
                  onRegisterBack={(fn) => { checkoutBackRef.current = fn }}
                  onBack={handleBack}
                  onConfirmationReached={() => {
                    setHideBack(true)
                    setCheckoutStepTitle("")
                  }}
                />
              </section>
            )}
          </div>

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

          <AgentPanel getSessionContext={getSessionContext} />

          <aside className={`fixed right-0 top-0 z-[80] flex h-full w-80 flex-col border-l border-ui-border-base bg-white shadow-xl transition-transform duration-300 ease-in-out ${supportOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex h-14 items-center justify-between border-b border-ui-border-base px-4">
              <span className="text-sm font-semibold">Support</span>
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-bg-subtle"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
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
      </AgentToolContextProvider>
    </LanguageContext.Provider>
  )
}
