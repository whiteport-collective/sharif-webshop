"use client"

import { useState, useTransition, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import TireSearch, { type TireSearchParams } from "@modules/home/components/tire-search"
import TireCard from "@modules/products/components/tire-card"
import TireResultsHeader, { type SortKey, SORT_OPTIONS } from "@modules/products/components/tire-results-header"
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

export type InitialSearch = {
  width: string
  profile: string
  rim: string
  season: string
  qty: number
}

/** Build a clean /dekk/ URL path from search params */
function buildDekkPath(width: string, profile: string, rim: string, season: string, qty: number): string {
  return `/dekk/${width}-${profile}R${rim}/${season}/${qty}`
}

export default function FlowShell({
  availableDimensions,
  dimensionCounts,
  countryCode,
  region,
  cartBadge,
  landingContent,
  landingFooter,
  initialSearch,
}: {
  availableDimensions: string[]
  dimensionCounts: Record<string, number>
  countryCode: string
  region: HttpTypes.StoreRegion
  cartBadge: React.ReactNode
  landingContent?: React.ReactNode
  landingFooter?: React.ReactNode
  initialSearch?: InitialSearch
}) {
  const [view, setView] = useState<FlowView>("home")
  const [activeSection, setActiveSection] = useState<FlowView>("home")
  const [lang, setLang] = useState<Lang>("no")
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [headerSortOpen, setHeaderSortOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const headerSortRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [activeSort, setActiveSort] = useState<SortKey>("price")
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
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
  const resetSearchRef = useRef<(() => void) | null>(null)
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
      top: target.offsetTop,
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
      const dekkPath = buildDekkPath(params.width, params.profile, params.rim, season, qty)
      window.history.pushState({ flowView: "results" }, "", dekkPath)
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
    if (initialSearch) {
      runSearch({
        width: initialSearch.width,
        profile: initialSearch.profile,
        rim: initialSearch.rim,
        qty: String(initialSearch.qty),
        season: initialSearch.season,
      }, false)
      const dekkPath = buildDekkPath(initialSearch.width, initialSearch.profile, initialSearch.rim, initialSearch.season, initialSearch.qty)
      // Ensure there's a "home" entry below so history.back() works on direct /dekk/ loads
      window.history.replaceState({ flowView: "home" }, "", "/")
      window.history.pushState({ flowView: "results" }, "", dekkPath)
    } else {
      window.history.replaceState({ flowView: "home" }, "", "/")
    }

    /** Parse /dekk/:dim/:season/:qty from a URL pathname */
    const parseDekkUrl = (pathname: string) => {
      const match = pathname.match(/^\/dekk\/(\d+)-(\d+)R(\d+)\/([^/]+?)(?:\/(\d+))?$/)
      if (!match) return null
      return { width: match[1], profile: match[2], rim: match[3], season: match[4], qty: match[5] || "4" }
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
        const parsed = parseDekkUrl(window.location.pathname)

        if (parsed) {
          runSearch({
            width: parsed.width,
            profile: parsed.profile,
            rim: parsed.rim,
            qty: parsed.qty,
            season: parsed.season,
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
  }, [runSearch, initialSearch])

  useEffect(() => {
    if (!langMenuOpen) return
    const close = (e: MouseEvent) => {
      if (langMenuRef.current?.contains(e.target as Node)) return
      setLangMenuOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [langMenuOpen])

  useEffect(() => {
    if (!headerSortOpen) return
    const close = (e: MouseEvent) => {
      if (headerSortRef.current?.contains(e.target as Node)) return
      setHeaderSortOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [headerSortOpen])


  const showResultsSection = Boolean(searchMeta.dimension)
  const showCheckoutSection = Boolean(selectedTire) && checkoutKey > 0

  const prevViewRef = useRef<FlowView>(view)
  useEffect(() => {
    if (view === prevViewRef.current) return
    prevViewRef.current = view

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
      const scrollMarker = surface.scrollTop + 64
      const resultsTop = showResultsSection ? (resultsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY
      const checkoutTop = showCheckoutSection ? (checkoutSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY

      const nextSection =
        scrollMarker >= checkoutTop ? "checkout"
        : scrollMarker >= resultsTop ? "results"
        : "home"

      setActiveSection((current) => {
        if (current === nextSection) return current
        if (nextSection !== "home") setMenuOpen(false)
        if (nextSection === "home") setView("home")
        return nextSection
      })
    }

    syncActiveSection()
    surface.addEventListener("scroll", syncActiveSection, { passive: true })
    return () => {
      surface.removeEventListener("scroll", syncActiveSection)
    }
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

  const chipDimension = searchMeta.dimension || previewDimension || ""
  const chipSeasonLabel = searchMeta.dimension ? (
    searchMeta.season === "sommer" ? t.summerTires :
    searchMeta.season === "vinter-piggfritt" ? t.winterStudless :
    searchMeta.season === "vinter-piggdekk" ? t.winterStudded : ""
  ) : ""
  const hasSearch = Boolean(chipDimension)
  const inFlow = activeSection !== "home"

  const handleHeaderBack = () => {
    if (activeSection === "checkout") {
      checkoutBackRef.current?.()
      return
    }
    handleBack()
  }

  const clearSearch = () => {
    setSearchMeta({ dimension: "", qty: 4, season: "sommer", seasonLabel: "" })
    setProducts([])
    setView("home")
    syncSelectedTire(null)
    resetSearchRef.current?.()
    window.history.replaceState({ flowView: "home" }, "", "/")
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <AgentToolContextProvider handlers={agentHandlers}>
        <div className="relative flex h-screen overflow-hidden bg-ui-bg-base" style={{ scrollbarGutter: "stable" as any }}>

          {/* Full-height menu column — desktop only (lg+), animated */}
          <aside
            className="hidden lg:flex flex-none flex-col bg-white z-[91] overflow-hidden border-r"
            style={{ width: menuOpen ? "15rem" : "0px", borderColor: menuOpen ? undefined : "transparent", transition: "width 300ms ease-in-out, border-color 300ms ease-in-out" }}
          >
            <div className="flex h-14 flex-none items-center border-b border-ui-border-base px-4">
              <span className="text-sm font-semibold text-ui-fg-base">Meny</span>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 whitespace-nowrap">
              <ul className="flex flex-col gap-4">
                <li><a href="/" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Home</a></li>
                <li><a href="/store" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Store</a></li>
                <li><a href="/brands" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Brands</a></li>
                <li><a href="/account" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Account</a></li>
                <li><a href="/cart" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Cart</a></li>
              </ul>
            </nav>
          </aside>

          {/* Main area (header + body) */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* ── Header bar ── */}
          <header className="flex-none z-[90] flex h-14 items-center border-b border-ui-border-base bg-white px-3">

            {/* Left: nav icon + logo + dimension chip */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {hideBack ? (
                <div className="w-9 flex-none" />
              ) : (
                <button
                  type="button"
                  onClick={activeSection === "home" ? () => setMenuOpen((open) => !open) : handleHeaderBack}
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full border"
                  style={{
                    borderColor: menuOpen && activeSection === "home" ? "#dc2626" : undefined,
                    backgroundColor: menuOpen && activeSection === "home" ? "#dc2626" : undefined,
                    color: menuOpen && activeSection === "home" ? "white" : undefined,
                    transition: "background-color 300ms ease-in-out, border-color 300ms ease-in-out, color 300ms ease-in-out",
                  }}
                  aria-label={activeSection === "home" ? "Meny" : "Tilbake"}
                >
                  {/* Hamburger + arrow stacked, crossfade on scroll */}
                  <div className="relative flex h-4 w-4 items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute" style={{ opacity: activeSection === "home" ? 1 : 0, transition: "opacity 300ms ease-in-out" }}>
                      <rect x="0" y="3" width="16" height="1.5" rx="0.75" fill="currentColor" />
                      <rect x="0" y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
                      <rect x="0" y="11.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute" style={{ opacity: activeSection === "home" ? 0 : 1, transition: "opacity 300ms ease-in-out" }}>
                      <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              )}
              <img src="/sharif-logo.png" alt="Sharif" className={`w-auto flex-none ${hasSearch ? "h-5 sm:h-7" : "h-7"}`} />
              {hasSearch && (
                <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scrollToSection("home")}
                    className="min-w-0 truncate text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base"
                    title={`${chipDimension}${chipSeasonLabel ? ` · ${chipSeasonLabel}` : ""}${searchMeta.qty ? ` · ${searchMeta.qty} stk` : ""} — trykk for å endre`}
                  >
                    <span>{chipDimension}</span>
                    {chipSeasonLabel ? <span> · {chipSeasonLabel}</span> : null}
                    {searchMeta.qty ? <span> · {searchMeta.qty} stk</span> : null}
                  </button>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-ui-fg-muted hover:text-ui-fg-base"
                    aria-label="Fjern søk"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Center: checkout step title only */}
            {checkoutStepTitle && (
              <div className="absolute left-1/2 flex -translate-x-1/2 items-center">
                <span className="text-sm font-semibold text-ui-fg-base">{checkoutStepTitle}</span>
              </div>
            )}

            {/* Right: context-aware controls */}
            <div className="flex flex-none items-center gap-1">

              {/* Results: count + sort — fades in/out with slide */}
              <div
                ref={headerSortRef}
                className="relative flex items-center gap-2 mr-1 transition-all duration-300"
                style={{
                  opacity: activeSection === "results" ? 1 : 0,
                  transform: activeSection === "results" ? "translateY(0)" : "translateY(-4px)",
                  pointerEvents: activeSection === "results" ? "auto" : "none",
                }}
              >
                <span className="hidden sm:block text-xs text-ui-fg-subtle whitespace-nowrap">{displayCount} dekk</span>
                <button
                  type="button"
                  onClick={() => setHeaderSortOpen((o) => !o)}
                  className="flex items-center gap-1 rounded-full bg-[#212529] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#343a40] transition-colors"
                >
                  {SORT_OPTIONS.find((o) => o.key === activeSort)?.label ?? "Sorter"}
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {headerSortOpen && (
                  <div className="absolute right-0 top-full mt-1 z-[70] w-52 rounded-xl border border-ui-border-base bg-white shadow-lg overflow-hidden">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => { setActiveSort(option.key); setHeaderSortOpen(false) }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${option.key === activeSort ? "bg-ui-bg-subtle font-semibold" : "hover:bg-ui-bg-subtle"}`}
                      >
                        {option.label}
                        {option.key === activeSort && <span className="text-ui-fg-interactive">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setChatOpen((open) => !open)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-ui-bg-subtle ${chatOpen ? "border-ui-fg-base bg-ui-bg-subtle text-ui-fg-base" : "border-ui-border-base text-ui-fg-base"}`}
                aria-label="Chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
          </header>

          {/* Mobile menu bar (<lg only) */}
          {menuOpen && (
            <div className="absolute inset-x-0 top-14 z-50 flex items-center justify-between border-b border-ui-border-base bg-white p-4 shadow-md lg:hidden">
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

          {/* Body: content + optional right column */}
          <div className="flex flex-1 overflow-hidden">

            {/* Scroll surface */}
            <div
              ref={surfaceRef}
              className="flex-1 overflow-y-auto"
              style={{ overscrollBehaviorY: "contain", scrollBehavior: "smooth" }}
            >
            <section
              ref={homeSectionRef}
              className="bg-ui-bg-base min-h-screen"
            >
              <div className="flex justify-center px-4 pb-16 pt-[18vh]">
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
                    onResetRef={(fn) => { resetSearchRef.current = fn }}
                  />
                </div>
              </div>

              {landingContent}
              {!showResultsSection && landingFooter}
            </section>

            {showResultsSection && (
              <section
                ref={resultsSectionRef}
                className="scroll-mt-14 min-h-screen border-t border-ui-border-base bg-ui-bg-base"
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
                    <div className="px-3 pt-20 pb-8 md:hidden">
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

                    <div className="hidden px-4 pt-20 pb-8 md:block">
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
                className="scroll-mt-14 min-h-screen border-t border-ui-border-base bg-ui-bg-base"
              >
                <CheckoutPanelContent
                  key={checkoutKey}
                  countryCode={countryCode}
                  embedded
                  isActive={activeSection === "checkout"}
                  cartLoading={cartLoading}
                  chatOpen={chatOpen}
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

            {/* Chat column — persistent on lg+, overlay below */}
            <AgentPanel open={chatOpen} onClose={() => setChatOpen(false)} getSessionContext={getSessionContext} />

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

          </div>{/* close main area wrapper */}
        </div>{/* close outer shell */}
      </AgentToolContextProvider>
    </LanguageContext.Provider>
  )
}
