"use client"

import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LanguageContext, UI, type Lang } from "@lib/i18n"
import { addToCart, deleteLineItem, retrieveCart } from "@lib/data/cart"
import { sortProducts } from "@lib/util/sort-tires"
import CheckoutPanelContent from "@modules/checkout/components/checkout-panel-content"
import {
  AgentToolContextProvider,
  type AgentToolHandlers,
} from "@modules/home/components/agent-panel/AgentToolContext"
import AgentPanel from "@modules/home/components/agent-panel"
import { type SelectedTire } from "@modules/home/components/quantity-shop"
import TireSearch, { type TireSearchParams } from "@modules/home/components/tire-search"
import ProductDetailPanel from "@modules/products/components/product-detail-panel"
import type { SortKey } from "@modules/products/lib/tire-sorting"
import { FlowShellHeader, FlowShellMenu } from "./flow-shell-header"
import { FlowShellResults } from "./flow-shell-results"
import type { FlowShellProps, FlowView, SearchMeta, SessionContext } from "./types"
import { buildDekkPath, getSeasonChipLabel, getSkeletonCount, parseDekkPath } from "./utils"
import { searchTires } from "../../../../app/actions/search-tires"

export default function FlowShell({
  availableDimensions,
  cartBadge,
  countryCode,
  dimensionCounts,
  initialSearch,
  landingContent,
  landingFooter,
  region,
}: FlowShellProps) {
  const [view, setView] = useState<FlowView>("home")
  const [activeSection, setActiveSection] = useState<FlowView>("home")
  const [lang, setLang] = useState<Lang>("no")
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [headerSortOpen, setHeaderSortOpen] = useState(false)
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [activeSort, setActiveSort] = useState<SortKey>("price")
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [hideBack, setHideBack] = useState(false)
  const [searchMeta, setSearchMeta] = useState<SearchMeta>({
    dimension: "",
    qty: 4,
    season: "sommer",
  })
  const [selectedTire, setSelectedTire] = useState<SelectedTire | null>(null)
  const [detailProduct, setDetailProduct] = useState<HttpTypes.StoreProduct | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewDimension, setPreviewDimension] = useState<string | null>(null)
  const [previewMeta, setPreviewMeta] = useState<SearchMeta | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(6)
  const [checkoutKey, setCheckoutKey] = useState(0)
  const [cartLoading, setCartLoading] = useState(false)
  const [checkoutStepTitle, setCheckoutStepTitle] = useState("")
  const checkoutBackRef = useRef<(() => void) | null>(null)
  const setDimensionRef = useRef<((w: string, p: string, r: string) => void) | null>(null)
  const resetSearchRef = useRef<(() => void) | null>(null)
  const agentPrefillRef = useRef<((field: string, value: string) => void) | null>(null)
  const agentOpenPaymentRef = useRef<(() => void) | null>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
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
  const previousViewRef = useRef<FlowView>("home")

  const syncSelectedTire = useCallback((tire: SelectedTire | null) => {
    selectedTireRef.current = tire
    setSelectedTire(tire)
  }, [])

  const scrollToSection = useCallback((targetView: FlowView, behavior: ScrollBehavior = "smooth") => {
    const surface = surfaceRef.current

    if (!surface) {
      return
    }

    const target =
      targetView === "home"
        ? homeSectionRef.current
        : targetView === "results"
          ? resultsSectionRef.current
          : checkoutSectionRef.current

    if (!target) {
      return
    }

    surface.scrollTo({
      top: target.offsetTop,
      behavior,
    })
  }, [])

  const pushFlowState = useCallback((nextView: FlowView, pathname: string) => {
    window.history.pushState({ flowView: nextView }, "", pathname)
  }, [])

  const runSearch = useCallback((params: TireSearchParams, pushHistory: boolean) => {
    const dimension = `${params.width}/${params.profile}R${params.rim}`
    const qty = Number(params.qty) || 4
    const season = params.season || "sommer"

    setHideBack(false)
    setSearchMeta({ dimension, qty, season })
    setActiveSort("price")
    setVisibleLimit(6)
    setView("results")

    if (pushHistory) {
      pushFlowState("results", buildDekkPath(params.width, params.profile, params.rim, season, qty))
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
  }, [countryCode, pushFlowState])

  const openCheckoutPanel = useCallback(() => {
    if (backLocked.current || !selectedTireRef.current) {
      return
    }

    backLocked.current = true
    setTimeout(() => {
      backLocked.current = false
    }, 600)

    setHideBack(false)
    setCheckoutKey((current) => current || 1)
    pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
    setView("checkout")
  }, [pushFlowState])

  const handleSelectTire = useCallback((product: HttpTypes.StoreProduct, qty: number) => {
    const variant = (product.variants?.[0] ?? {}) as any
    const existing = selectedTireRef.current

    if (existing?.lineItemId && existing.product.variants?.[0]?.id === variant.id) {
      setHideBack(false)
      setCheckoutKey((current) => current + 1)
      pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
      setView("checkout")
      return
    }

    const unitPrice = variant?.calculated_price?.calculated_amount ?? 0
    const currencyCode = variant?.calculated_price?.currency_code ?? region.currency_code ?? "NOK"

    syncSelectedTire({ product, initialQty: qty, unitPrice, currencyCode })

    if (!variant?.id) {
      return
    }

    setHideBack(false)
    setCartLoading(true)
    setCheckoutKey((current) => current + 1)
    pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
    setView("checkout")

    startTransition(async () => {
      try {
        const currentCart = await retrieveCart()
        const alreadyInCart = currentCart?.items?.some((item: any) => item.variant_id === variant.id)

        if (!alreadyInCart) {
          await addToCart({ variantId: variant.id, quantity: qty, countryCode })
        }
      } catch {
        // Checkout refreshes cart state on its own.
      }

      setCartLoading(false)
      router.refresh()
    })
  }, [countryCode, pushFlowState, region.currency_code, router, syncSelectedTire])

  const handleRemoveTire = useCallback(() => {
    const lineItemId = selectedTireRef.current?.lineItemId
    syncSelectedTire(null)

    if (view === "checkout") {
      setView("results")
    }

    if (!lineItemId) {
      return
    }

    startTransition(async () => {
      await deleteLineItem(lineItemId)
      router.refresh()
    })
  }, [router, syncSelectedTire, view])

  const handleDimensionChange = useCallback((dimension: string | null) => {
    setPreviewDimension(dimension)

    if (!dimension || prefetchCache.current.has(dimension) || prefetchInFlight.current.has(dimension)) {
      return
    }

    prefetchInFlight.current.add(dimension)

    const [widthPart, rest] = dimension.split("/")
    const [profilePart, rimPart] = rest.split("R")

    startTransition(async () => {
      const result = await searchTires(countryCode, widthPart, profilePart, rimPart)
      prefetchCache.current.set(dimension, result.products)
      prefetchInFlight.current.delete(dimension)
    })
  }, [countryCode])

  const handlePopState = useCallback((event: PopStateEvent) => {
    const flowView = event.state?.flowView as FlowView | undefined

    if (flowView === "home") {
      event.stopImmediatePropagation()
      setActiveSection("home")
      setView("home")
      return
    }

    if (flowView === "results") {
      event.stopImmediatePropagation()
      const parsed = parseDekkPath(window.location.pathname)

      if (parsed) {
        runSearch(
          {
            width: parsed.width,
            profile: parsed.profile,
            rim: parsed.rim,
            qty: parsed.qty,
            season: parsed.season,
          },
          false
        )
      } else {
        setActiveSection("results")
        setView("results")
      }
      return
    }

    if (flowView === "checkout") {
      event.stopImmediatePropagation()
      const nextView = selectedTireRef.current ? "checkout" : "results"
      setActiveSection(nextView)
      setView(nextView)
    }
  }, [runSearch])

  useEffect(() => {
    if (initialSearch) {
      runSearch(
        {
          width: initialSearch.width,
          profile: initialSearch.profile,
          rim: initialSearch.rim,
          qty: String(initialSearch.qty),
          season: initialSearch.season,
        },
        false
      )

      window.history.replaceState({ flowView: "home" }, "", "/")
      pushFlowState(
        "results",
        buildDekkPath(initialSearch.width, initialSearch.profile, initialSearch.rim, initialSearch.season, initialSearch.qty)
      )
    } else {
      window.history.replaceState({ flowView: "home" }, "", "/")
    }
  }, [initialSearch, pushFlowState, runSearch])

  useEffect(() => {
    window.addEventListener("popstate", handlePopState, true)
    return () => window.removeEventListener("popstate", handlePopState, true)
  }, [handlePopState])

  const handleDocumentMouseDown = useCallback((event: MouseEvent) => {
    if (langMenuOpen && langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
      setLangMenuOpen(false)
    }

    if (headerSortOpen && sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
      setHeaderSortOpen(false)
    }
  }, [headerSortOpen, langMenuOpen])

  useEffect(() => {
    if (!langMenuOpen && !headerSortOpen) {
      return
    }

    document.addEventListener("mousedown", handleDocumentMouseDown)
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown)
  }, [handleDocumentMouseDown, headerSortOpen, langMenuOpen])

  const showResultsSection = Boolean(searchMeta.dimension)
  const showCheckoutSection = Boolean(selectedTire) && checkoutKey > 0

  useEffect(() => {
    if (view === previousViewRef.current) {
      return
    }

    previousViewRef.current = view

    if (view === "results" && !showResultsSection) {
      return
    }

    if (view === "checkout" && !showCheckoutSection) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(view, view === "home" ? "auto" : "smooth")
    })

    return () => window.cancelAnimationFrame(frame)
  }, [scrollToSection, showCheckoutSection, showResultsSection, view])

  useEffect(() => {
    const surface = surfaceRef.current

    if (!surface) {
      return
    }

    const syncActiveSection = () => {
      const scrollMarker = surface.scrollTop + 64
      const resultsTop = showResultsSection ? (resultsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY
      const checkoutTop = showCheckoutSection ? (checkoutSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY

      const nextSection =
        scrollMarker >= checkoutTop ? "checkout" : scrollMarker >= resultsTop ? "results" : "home"

      setActiveSection((current) => {
        if (current === nextSection) {
          return current
        }

        if (nextSection !== "home") {
          setMenuOpen(false)
        }

        if (nextSection === "home") {
          setView("home")
        }

        return nextSection
      })
    }

    syncActiveSection()
    surface.addEventListener("scroll", syncActiveSection, { passive: true })

    return () => {
      surface.removeEventListener("scroll", syncActiveSection)
    }
  }, [showCheckoutSection, showResultsSection])

  const knownCount = dimensionCounts[searchMeta.dimension] ?? 0
  const sortedProducts = useMemo(() => sortProducts(products, activeSort), [activeSort, products])
  const displayCount = isLoading ? knownCount : products.length
  const skeletonCount = getSkeletonCount(knownCount)
  const hasMoreResults = !isLoading && sortedProducts.length > visibleLimit
  const showCheckoutAction = !isLoading && Boolean(selectedTire)
  const chipDimension = searchMeta.dimension || previewMeta?.dimension || previewDimension || ""
  const chipSeason = searchMeta.dimension ? searchMeta.season : previewMeta?.season
  const chipSeasonLabel = chipSeason ? getSeasonChipLabel(chipSeason, lang) : ""
  const chipQty = searchMeta.dimension ? searchMeta.qty : (previewMeta?.qty ?? 0)
  const hasSearch = Boolean(chipDimension)

  const handleSearch = useCallback((params: TireSearchParams) => {
    runSearch(params, true)
  }, [runSearch])

  const handleBack = useCallback(() => {
    if (backLocked.current) {
      return
    }

    backLocked.current = true
    setTimeout(() => {
      backLocked.current = false
    }, 600)

    window.history.back()
  }, [])

  const handleHeaderBack = useCallback(() => {
    if (activeSection === "checkout") {
      checkoutBackRef.current?.()
      return
    }

    handleBack()
  }, [activeSection, handleBack])

  const clearSearch = useCallback(() => {
    setSearchMeta({ dimension: "", qty: 4, season: "sommer" })
    setProducts([])
    setView("home")
    setDetailProduct(null)
    setPreviewDimension(null)
    setPreviewMeta(null)
    setCheckoutKey(0)
    setHideBack(false)
    setCheckoutStepTitle("")
    syncSelectedTire(null)
    pendingParams.current = null
    resetSearchRef.current?.()
    window.history.replaceState({ flowView: "home" }, "", "/")
  }, [syncSelectedTire])

  const agentHandlers: AgentToolHandlers = {
    fillDimensionField: (width, profile, rim) => {
      setDimensionRef.current?.(String(width), String(profile), String(rim))
    },
    triggerSearch: () => {
      if (pendingParams.current) {
        runSearch(pendingParams.current, true)
      }
    },
    selectTire: (productId) => {
      const product = products.find((entry) => entry.id === productId)
      if (product) {
        handleSelectTire(product, searchMeta.qty)
      }
    },
    scrollToProduct: (productId) => {
      const element = document.querySelector(`[data-product-id="${productId}"]`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    prefillCheckoutField: (field, value) => {
      agentPrefillRef.current?.(field, value)
    },
    openPaymentStep: () => {
      agentOpenPaymentRef.current?.()
    },
  }

  const getSessionContext = useCallback((): SessionContext => ({
    view: activeSection,
    dimension: searchMeta.dimension || null,
    visibleProductIds: products.map((product) => product.id ?? ""),
    cartItems: selectedTire ? [{ productId: selectedTire.product.id ?? "", qty: selectedTire.initialQty }] : [],
    step: activeSection === "checkout" ? checkoutStepTitle || null : null,
  }), [activeSection, checkoutStepTitle, products, searchMeta.dimension, selectedTire])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <AgentToolContextProvider handlers={agentHandlers}>
        <div className="relative flex h-screen overflow-hidden bg-ui-bg-base" style={{ scrollbarGutter: "stable" as any }}>
          <FlowShellMenu menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

          <div className="relative flex flex-1 flex-col overflow-hidden">
            <FlowShellHeader
              activeSection={activeSection}
              activeSort={activeSort}
              cartBadge={cartBadge}
              chatOpen={chatOpen}
              checkoutStepTitle={checkoutStepTitle}
              chipDimension={chipDimension}
              chipSeasonLabel={chipSeasonLabel}
              displayCount={displayCount}
              handleHeaderBack={handleHeaderBack}
              hasSearch={hasSearch}
              headerSortOpen={headerSortOpen}
              hideBack={hideBack}
              lang={lang}
              langMenuOpen={langMenuOpen}
              langMenuRef={langMenuRef}
              menuOpen={menuOpen}
              onClearSearch={clearSearch}
              onScrollHome={() => scrollToSection("home")}
              onSelectLanguage={(nextLang) => {
                setLang(nextLang)
                setLangMenuOpen(false)
              }}
              onSortChange={setActiveSort}
              setChatOpen={setChatOpen}
              setHeaderSortOpen={setHeaderSortOpen}
              setLangMenuOpen={setLangMenuOpen}
              setMenuOpen={setMenuOpen}
              sortMenuRef={sortMenuRef}
              qty={chipQty}
            />

            <div className="flex flex-1 overflow-hidden">
              <div
                ref={surfaceRef}
                className="flex-1 overflow-y-auto"
                style={{ overscrollBehaviorY: "contain", scrollBehavior: "smooth" }}
              >
                <section ref={homeSectionRef} className="min-h-screen bg-ui-bg-base">
                  <div className="flex justify-center px-4 pb-16 pt-[18vh]">
                    <div className="w-full max-w-xl">
                      <h1 className="mb-3 text-center text-4xl font-bold md:text-5xl">{t.homeTitle}</h1>
                      <p className="mb-8 text-center text-ui-fg-subtle">{t.homeSubtitle}</p>
                      <TireSearch
                        availableDimensions={availableDimensions}
                        dimensionCounts={dimensionCounts}
                        onSearch={handleSearch}
                        onDimensionChange={handleDimensionChange}
                        onFormChange={(params) => {
                          pendingParams.current = params
                          setPreviewMeta(
                            params
                              ? {
                                  dimension: `${params.width}/${params.profile}R${params.rim}`,
                                  qty: Number(params.qty) || 4,
                                  season: params.season || "sommer",
                                }
                              : null
                          )
                        }}
                        previewCount={previewDimension ? dimensionCounts[previewDimension] : undefined}
                        onMount={(fn) => {
                          setDimensionRef.current = fn
                        }}
                        onResetRef={(fn) => {
                          resetSearchRef.current = fn
                        }}
                      />
                    </div>
                  </div>

                  {landingContent}
                  {!showResultsSection && landingFooter}
                </section>

                {showResultsSection && (
                  <section
                    ref={resultsSectionRef}
                    className="min-h-screen scroll-mt-14 border-t border-ui-border-base bg-ui-bg-base"
                  >
                    <FlowShellResults
                      hasMoreResults={hasMoreResults}
                      isLoading={isLoading}
                      onLoadMore={() => setVisibleLimit((current) => current + 6)}
                      onOpenCheckout={openCheckoutPanel}
                      onProductDetail={setDetailProduct}
                      onRemoveTire={handleRemoveTire}
                      onSearchChange={handleBack}
                      onSelectTire={handleSelectTire}
                      qty={searchMeta.qty}
                      region={region}
                      searchDimension={searchMeta.dimension}
                      selectedTire={selectedTire}
                      showCheckoutAction={showCheckoutAction}
                      skeletonCount={skeletonCount}
                      sortedProducts={sortedProducts}
                      t={t}
                      visibleLimit={visibleLimit}
                    />
                  </section>
                )}

                {showCheckoutSection && (
                  <section
                    ref={checkoutSectionRef}
                    className="min-h-screen scroll-mt-14 border-t border-ui-border-base bg-ui-bg-base"
                  >
                    <CheckoutPanelContent
                      key={checkoutKey}
                      countryCode={countryCode}
                      embedded
                      isActive={activeSection === "checkout"}
                      cartLoading={cartLoading}
                      chatOpen={chatOpen}
                      onStepTitle={setCheckoutStepTitle}
                      onRegisterBack={(fn) => {
                        checkoutBackRef.current = fn
                      }}
                      onBack={handleBack}
                      onConfirmationReached={() => {
                        setHideBack(true)
                        setCheckoutStepTitle("")
                      }}
                    />
                  </section>
                )}
              </div>

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
          </div>
        </div>
      </AgentToolContextProvider>
    </LanguageContext.Provider>
  )
}
