"use client"

import { HttpTypes } from "@medusajs/types"
import { startTransition, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
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
import TireSearch, {
  type AgentSearchField,
  type TireSearchAPI,
  type TireSearchParams,
} from "@modules/home/components/tire-search"
import ProductDetailPanel from "@modules/products/components/product-detail-panel"
import type { SortKey } from "@modules/products/lib/tire-sorting"
import { FlowShellHeader, FlowShellMenu } from "./flow-shell-header"
import { FlowShellResults } from "./flow-shell-results"
import type { FlowShellProps, FlowView, SearchMeta, SessionContext } from "./types"
import type { AgentCheckoutAPI } from "@modules/checkout/components/checkout-panel-content"
import {
  canNavigateBack,
  deriveFlowShellScene,
  initialFlowShellState,
  mapFlowToLegacyView,
  reduceFlowShellState,
} from "./state"
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
  const [appState, dispatch] = useReducer(reduceFlowShellState, initialFlowShellState)
  const [activeSection, setActiveSection] = useState<FlowView>("home")
  const [lang, setLang] = useState<Lang>("no")
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [headerSortOpen, setHeaderSortOpen] = useState(false)
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [activeSort, setActiveSort] = useState<SortKey>("price")
  const [menuOpen, setMenuOpen] = useState(false)
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
  const [cartQty, setCartQty] = useState<number | null>(null)
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [highlightedProductIds, setHighlightedProductIds] = useState<Set<string>>(new Set())
  const checkoutBackRef = useRef<(() => void) | null>(null)
  const agentCheckoutRef = useRef<AgentCheckoutAPI | null>(null)
  const tireSearchRef = useRef<TireSearchAPI | null>(null)
  const setDimensionRef = useRef<((w: string, p: string, r: string) => void) | null>(null)
  const setSearchFieldRef = useRef<((field: AgentSearchField, value: string) => void) | null>(null)
  const resetSearchRef = useRef<(() => void) | null>(null)
  const agentPrefillRef = useRef<((field: string, value: string) => void) | null>(null)
  const agentOpenPaymentRef = useRef<(() => void) | null>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  const t = UI[lang]
  const prefetchCache = useRef<Map<string, HttpTypes.StoreProduct[]>>(new Map())
  const prefetchInFlight = useRef<Set<string>>(new Set())
  const surfaceRef = useRef<HTMLDivElement>(null)
  const homeSectionRef = useRef<HTMLDivElement>(null)
  const resultsSectionRef = useRef<HTMLDivElement>(null)
  const checkoutSectionRef = useRef<HTMLDivElement>(null)
  const backLocked = useRef(false)
  const programmaticScroll = useRef(false)
  const pendingParams = useRef<TireSearchParams | null>(null)
  const agentSearchFields = useRef<{ width?: string; profile?: string; rim?: string; qty?: string; season?: string }>({})
  const selectedTireRef = useRef<SelectedTire | null>(null)
  const previousViewRef = useRef<FlowView>("home")
  const sessionIdRef = useRef<string | null>(null)
  const agentHandlersRef = useRef<AgentToolHandlers | null>(null)
  const view = mapFlowToLegacyView(appState.flow)
  const scene = deriveFlowShellScene(appState)
  const chatOpen = appState.assistant === "open"
  const hideBack = appState.checkoutLocked || appState.flow === "complete"

  useEffect(() => {
    retrieveCart().then((fresh) => {
      const qty = fresh?.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0
      setCartQty(qty)
      setCart(fresh ?? null)
      dispatch({ type: "CART_UPDATED", hasItems: qty > 0 })
    })
  }, [])

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

    // Use getBoundingClientRect so the offset is relative to the scroll container,
    // not the nearest positioned ancestor (which includes the 56px sticky header).
    const surfaceTop = surface.getBoundingClientRect().top
    const targetTop = target.getBoundingClientRect().top
    // Guard scroll-sync from hijacking view while our own smooth scroll is running.
    programmaticScroll.current = true
    setTimeout(() => { programmaticScroll.current = false }, 900)
    surface.scrollTo({
      top: surface.scrollTop + (targetTop - surfaceTop),
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

    setSearchMeta({ dimension, qty, season })
    setActiveSort("price")
    setVisibleLimit(6)
    dispatch({ type: "DIMENSIONS_VALID" })
    dispatch({ type: "SEARCH_SUBMITTED" })

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

    setCheckoutKey((current) => current || 1)
    pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
    dispatch({ type: "NAV_TO_CHECKOUT" })
  }, [pushFlowState])

  const handleSelectTire = useCallback((product: HttpTypes.StoreProduct, qty: number) => {
    if (backLocked.current) {
      return
    }

    backLocked.current = true
    setTimeout(() => {
      backLocked.current = false
    }, 600)

    const variant = (product.variants?.[0] ?? {}) as any
    const existing = selectedTireRef.current

    if (existing?.lineItemId && existing.product.variants?.[0]?.id === variant.id) {
      setCheckoutKey((current) => current + 1)
      pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
      dispatch({ type: "NAV_TO_CHECKOUT" })
      return
    }

    const unitPrice = variant?.calculated_price?.calculated_amount ?? 0
    const currencyCode = variant?.calculated_price?.currency_code ?? region.currency_code ?? "NOK"

    syncSelectedTire({ product, initialQty: qty, unitPrice, currencyCode })

    if (!variant?.id) {
      return
    }

    dispatch({ type: "CART_SYNC_STARTED" })
    setCartLoading(true)
    setCheckoutKey((current) => current + 1)
    pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
    dispatch({ type: "NAV_TO_CHECKOUT" })

    startTransition(async () => {
      try {
        let currentCart = await retrieveCart()
        const alreadyInCart = currentCart?.items?.some((item: any) => item.variant_id === variant.id)

        if (!alreadyInCart) {
          await addToCart({ variantId: variant.id, quantity: qty, countryCode })
          currentCart = await retrieveCart()
        }

        const lineItem = currentCart?.items?.find((item: any) => item.variant_id === variant.id)
        if (lineItem && selectedTireRef.current) {
          const updated = { ...selectedTireRef.current, lineItemId: lineItem.id }
          selectedTireRef.current = updated
          setSelectedTire(updated)
        }
        const newQty = currentCart?.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? qty
        setCartQty(newQty)
        setCart(currentCart ?? null)
        dispatch({ type: "CART_UPDATED", hasItems: newQty > 0 })
      } catch {
        // Checkout refreshes cart state on its own.
        setCartQty(qty)
        dispatch({ type: "CART_SYNC_FAILED" })
      }

      setCartLoading(false)
    })
  }, [countryCode, pushFlowState, region.currency_code, syncSelectedTire])

  const handleRemoveTire = useCallback((product: HttpTypes.StoreProduct) => {
    const variantId = product.variants?.[0]?.id
    const selectedVariantId = selectedTireRef.current?.product.variants?.[0]?.id
    const lineItemId =
      (selectedVariantId && selectedVariantId === variantId
        ? selectedTireRef.current?.lineItemId
        : undefined) ??
      ((cart?.items ?? []) as Array<{ id?: string; variant_id?: string }>).find(
        (item) => item.variant_id === variantId
      )?.id

    if (selectedTireRef.current?.product.id === product.id) {
      syncSelectedTire(null)
    }

    if (!lineItemId) {
      return
    }

    startTransition(async () => {
      await deleteLineItem(lineItemId)
      const fresh = await retrieveCart()
      const nextQty = fresh?.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0
      setCartQty(nextQty)
      setCart(fresh ?? null)
      if (nextQty === 0) {
        setCheckoutKey(0)
        setCheckoutStepTitle("")
        setActiveSection(searchMeta.dimension ? "results" : "home")
      }
      dispatch({ type: "CART_UPDATED", hasItems: nextQty > 0 })
    })
  }, [cart?.items, searchMeta.dimension, syncSelectedTire])

  const handleRemoveLine = useCallback((lineItemId: string) => {
    if (selectedTireRef.current?.lineItemId === lineItemId) {
      syncSelectedTire(null)
    }
    startTransition(async () => {
      await deleteLineItem(lineItemId)
      const fresh = await retrieveCart()
      const qty = fresh?.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0
      setCartQty(qty)
      setCart(fresh ?? null)
      if (qty === 0) {
        setCheckoutKey(0)
        setCheckoutStepTitle("")
        setActiveSection(searchMeta.dimension ? "results" : "home")
      }
      dispatch({ type: "CART_UPDATED", hasItems: qty > 0 })
    })
  }, [searchMeta.dimension, syncSelectedTire])

  const handleDimensionChange = useCallback((dimension: string | null) => {
    setPreviewDimension(dimension)

    if (!dimension) {
      dispatch({ type: "DIMENSIONS_PARTIAL" })
    } else if (cartQty && cartQty > 0 && searchMeta.dimension && dimension !== searchMeta.dimension) {
      dispatch({ type: "DIMENSION_CONFLICT" })
    }

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

    if (!canNavigateBack(appState)) {
      event.stopImmediatePropagation()
      window.history.pushState(
        { flowView: mapFlowToLegacyView(appState.flow) },
        "",
        `${window.location.pathname}${window.location.search}`
      )
      return
    }

    if (flowView === "home") {
      event.stopImmediatePropagation()
      setActiveSection("home")
      dispatch({ type: "NAV_TO_DEFAULT" })
      return
    }

    if (flowView === "results") {
      event.stopImmediatePropagation()
      const parsed = parseDekkPath(window.location.pathname)

      if (parsed) {
        setActiveSection("results")
        dispatch({ type: "NAV_TO_RESULTS" })
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
        window.requestAnimationFrame(() => {
          setActiveSection("results")
          scrollToSection("results", "auto")
          window.setTimeout(() => {
            setActiveSection("results")
            scrollToSection("results", "auto")
          }, 60)
        })
      } else {
        setActiveSection("results")
        dispatch({ type: "NAV_TO_RESULTS" })
      }
      return
    }

    if (flowView === "checkout") {
      // If checkoutStep is set, CheckoutPanelContent handles the internal step navigation
      if (event.state?.checkoutStep) return
      event.stopImmediatePropagation()
      const nextView = selectedTireRef.current ? "checkout" : "results"
      setActiveSection(nextView)
      dispatch({ type: nextView === "checkout" ? "NAV_TO_CHECKOUT" : "NAV_TO_RESULTS" })
    }
  }, [appState, runSearch, scrollToSection])

  const initialSearchKey = initialSearch
    ? `${initialSearch.width}/${initialSearch.profile}/${initialSearch.rim}/${initialSearch.season}/${initialSearch.qty}`
    : null

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchKey, pushFlowState, runSearch])

  useEffect(() => {
    window.addEventListener("popstate", handlePopState, true)
    return () => window.removeEventListener("popstate", handlePopState, true)
  }, [handlePopState])

  // Order complete — cart was consumed by placeOrder, clear local state so the
  // badge shows empty and the cart popup is empty.
  useEffect(() => {
    if (appState.flow === "complete") {
      setCartQty(0)
      setCart(null)
    }
  }, [appState.flow])

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
      // View changes are state-driven and should land immediately.
      // Smooth scrolling here leaves visible “extra roll” when entering
      // checkout/results and when returning after cart mutations.
      scrollToSection(view, "auto")
    })

    return () => window.cancelAnimationFrame(frame)
  }, [scrollToSection, showCheckoutSection, showResultsSection, view])

  useEffect(() => {
    const surface = surfaceRef.current

    if (!surface) {
      return
    }

    const syncActiveSection = () => {
      if (programmaticScroll.current) {
        return
      }

      const scrollMarker = surface.scrollTop + 64
      const resultsTop = showResultsSection ? (resultsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY
      const checkoutTop = showCheckoutSection ? (checkoutSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY

      const nextSection =
        scrollMarker >= checkoutTop ? "checkout" : scrollMarker >= resultsTop ? "results" : "home"

      if (view === "results" && showResultsSection && nextSection === "home") {
        return
      }

      setActiveSection((current) => {
        if (current === nextSection) {
          return current
        }

        if (nextSection !== "home") {
          setMenuOpen(false)
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
    setMenuOpen(false)
    runSearch(params, true)
  }, [runSearch])

  const handleBack = useCallback(() => {
    if (backLocked.current) {
      return
    }

    if (!canNavigateBack(appState)) {
      return
    }

    backLocked.current = true
    setTimeout(() => {
      backLocked.current = false
    }, 600)

    window.history.back()
  }, [appState])

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
    setDetailProduct(null)
    setPreviewDimension(null)
    setPreviewMeta(null)
    setCheckoutKey(0)
    setCheckoutStepTitle("")
    setActiveSection("home")
    setHeaderSortOpen(false)
    syncSelectedTire(null)
    pendingParams.current = null
    resetSearchRef.current?.()
    dispatch({ type: "DIMENSIONS_CLEARED" })
    window.history.replaceState({ flowView: "home" }, "", "/")
  }, [syncSelectedTire])

  useEffect(() => {
    if (view === "home") {
      setActiveSection("home")
      return
    }

    if (view === "results" && showResultsSection) {
      setActiveSection("results")
      return
    }

    if (view === "checkout" && showCheckoutSection) {
      setActiveSection("checkout")
    }
  }, [showCheckoutSection, showResultsSection, view])

  const agentHandlers: AgentToolHandlers = {
    setSearchField: (field, value) => {
      setSearchFieldRef.current?.(field, String(value))
      agentSearchFields.current[field] = String(value)
    },
    fillDimensionField: (width, profile, rim) => {
      setDimensionRef.current?.(String(width), String(profile), String(rim))
    },
    triggerSearch: () => {
      const af = agentSearchFields.current
      if (af.width && af.profile && af.rim) {
        runSearch({ width: af.width, profile: af.profile, rim: af.rim, qty: af.qty ?? "4", season: af.season ?? "sommer" }, true)
      } else if (pendingParams.current) {
        runSearch(pendingParams.current, true)
      }
    },
    selectTire: (productId) => {
      const product = products.find((entry) => entry.id === productId)
      if (product) {
        handleSelectTire(product, searchMeta.qty)
      }
    },
    selectTireForCheckout: (productId) => {
      const product = products.find((entry) => entry.id === productId)
      if (!product) return
      const variant = product.variants?.[0] as any
      const existingTire = selectedTireRef.current
      if (existingTire && existingTire.product.variants?.[0]?.id === variant?.id && existingTire.lineItemId) {
        setCheckoutKey((current) => current + 1)
        pushFlowState("checkout", `${window.location.pathname}${window.location.search}`)
        dispatch({ type: "NAV_TO_CHECKOUT" })
        return
      }
      handleSelectTire(product, searchMeta.qty)
    },
    scrollToProduct: (productId) => {
      const element = document.querySelector(`[data-product-id="${productId}"]`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    highlightProducts: (productIds) => {
      setHighlightedProductIds(new Set(productIds))
    },
    clearHighlights: () => {
      setHighlightedProductIds(new Set())
    },
    prefillCheckoutField: (field, value) => {
      agentCheckoutRef.current?.prefillField(field, value)
    },
    advanceCheckoutStep: () => {
      agentCheckoutRef.current?.advanceStep()
    },
    getCheckoutState: () => {
      agentCheckoutRef.current?.getState()
    },
    openPaymentStep: () => {
      agentOpenPaymentRef.current?.()
    },
    navigateBack: () => {
      handleBack()
    },
  }

  // Keep agentHandlersRef in sync so the SSE hook below always uses latest closures
  agentHandlersRef.current = agentHandlers

  // Headless SSE channel — open once, persist across re-renders
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_ENABLE_HEADLESS_AGENT !== "true") return

    const sid = crypto.randomUUID()
    sessionIdRef.current = sid

    const es = new EventSource(`/api/agent/stream?sessionId=${sid}`)

    es.addEventListener("message", async (ev) => {
      let msg: { type: string; commandId?: string; tool?: string; args?: Record<string, unknown> }
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }
      if (msg.type !== "tool-invoke" || !msg.commandId || !msg.tool) return

      const h = agentHandlersRef.current
      const a = msg.args ?? {}

      let result: unknown
      try {
        switch (msg.tool) {
          case "setSearchField":      result = h?.setSearchField(a.field as any, a.value as any); break
          case "fillDimensionField":  result = h?.fillDimensionField(a.width as any, a.profile as any, a.rim as any); break
          case "triggerSearch":       result = h?.triggerSearch(); break
          case "selectTire":          result = h?.selectTire(a.productId as string); break
          case "selectTireForCheckout": result = h?.selectTireForCheckout(a.productId as string); break
          case "scrollToProduct":     result = h?.scrollToProduct(a.productId as string); break
          case "highlightProducts":   result = h?.highlightProducts(a.productIds as string[]); break
          case "clearHighlights":     result = h?.clearHighlights(); break
          case "prefillCheckoutField": result = h?.prefillCheckoutField(a.field as string, a.value as string); break
          case "advanceCheckoutStep": result = h?.advanceCheckoutStep(); break
          case "getCheckoutState":    result = h?.getCheckoutState(); break
          case "openPaymentStep":     result = h?.openPaymentStep(); break
          case "navigateBack":        result = h?.navigateBack(); break
          default: result = { ok: false, reason: `Unknown tool: ${msg.tool}` }
        }
        result ??= { ok: true }
      } catch (err) {
        result = { ok: false, reason: err instanceof Error ? err.message : "handler error" }
      }

      fetch("/api/agent/command/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandId: msg.commandId, result }),
      }).catch(() => {})
    })

    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getSessionContext = useCallback((): SessionContext => {
    const searchForm = tireSearchRef.current?.getFormSnapshot() ?? {
      width: null,
      profile: null,
      rim: null,
      qty: null,
      season: null,
      submitted: Boolean(searchMeta.dimension),
    }
    const checkout = agentCheckoutRef.current?.getSnapshot() ?? null

    return {
      view: activeSection,
      countryCode,
      dimension: searchMeta.dimension || null,
      searchForm,
      scene,
      selectedProductId: selectedTire?.product.id ?? null,
      activeSort: activeSort ?? null,
      visibleProductIds: products.map((product) => product.id ?? ""),
      visibleProducts: products.map((product) => {
        const variant = (product.variants?.[0] ?? {}) as any
        const meta = (product.metadata ?? {}) as {
          noise_db?: string | number
          grip_rating?: string
          fuel_rating?: string
        }
        const noiseDb = meta.noise_db != null && meta.noise_db !== "" ? Number(meta.noise_db) : null

        return {
          id: product.id ?? "",
          title: product.title ?? "",
          price:
            typeof variant?.calculated_price?.calculated_amount === "number"
              ? variant.calculated_price.calculated_amount
              : null,
          noiseDb: Number.isFinite(noiseDb as number) ? (noiseDb as number) : null,
          wetGrip: meta.grip_rating ?? null,
          fuelEfficiency: meta.fuel_rating ?? null,
        }
      }),
      cart: selectedTire
        ? {
            productId: selectedTire.product.id ?? "",
            productTitle: selectedTire.product.title ?? "",
            brand: String((selectedTire.product as any).brand ?? ""),
            price: selectedTire.unitPrice ?? 0,
            qty: selectedTire.initialQty,
            total: (selectedTire.unitPrice ?? 0) * selectedTire.initialQty,
          }
        : null,
      checkoutStep: activeSection === "checkout" ? checkout?.step ?? null : null,
      deliveryType: activeSection === "checkout" ? checkout?.deliveryType ?? null : null,
      address: activeSection === "checkout" ? checkout?.address ?? null : null,
      shippingMethods: activeSection === "checkout" ? checkout?.shippingMethods ?? [] : [],
      selectedShippingMethodId:
        activeSection === "checkout" ? checkout?.selectedShippingMethodId ?? null : null,
      bookingSlots: activeSection === "checkout" ? checkout?.bookingSlots ?? [] : [],
      selectedBookingSlotId:
        activeSection === "checkout" ? checkout?.selectedBookingSlotId ?? null : null,
    }
  }, [activeSection, activeSort, countryCode, products, scene, searchMeta.dimension, selectedTire])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <AgentToolContextProvider handlers={agentHandlers}>
        <div className="relative flex h-screen overflow-hidden bg-ui-bg-base" style={{ scrollbarGutter: "stable" as any }}>
          <FlowShellMenu menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

          <div className="relative flex flex-1 flex-col overflow-hidden" style={{ minWidth: 0 }}>
            <FlowShellHeader
              activeSection={activeSection}
              activeSort={activeSort}
              cart={cart}
              cartBadge={cartBadge}
              cartQty={cartQty}
              chatOpen={chatOpen}
              checkoutLocked={appState.checkoutLocked}
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
              onRemoveLine={handleRemoveLine}
              onScrollHome={() => scrollToSection("home")}
              onSelectLanguage={(nextLang) => {
                setLang(nextLang)
                setLangMenuOpen(false)
              }}
              onSortChange={setActiveSort}
              setChatOpen={(next) => {
                const resolved = typeof next === "function" ? next(chatOpen) : next
                dispatch({ type: resolved ? "ASSISTANT_OPENED" : "ASSISTANT_CLOSED" })
              }}
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
                {appState.conflict === "dimension_conflict" && (
                  <div className="sticky top-0 z-20 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm">
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
                      <p className="text-amber-900">
                        You already have items in the cart. Start a new search for another car or cancel to keep the current results.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            clearSearch()
                            dispatch({ type: "DIMENSION_CONFLICT_DISMISSED" })
                            scrollToSection("home", "auto")
                          }}
                          className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Start new search
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: "DIMENSION_CONFLICT_DISMISSED" })
                            if (searchMeta.dimension) {
                              const [width, rest] = searchMeta.dimension.split("/")
                              const [profile, rim] = rest.split("R")
                              setDimensionRef.current?.(width, profile, rim)
                            }
                            setPreviewDimension(null)
                            setPreviewMeta(null)
                          }}
                          className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {appState.flow !== "complete" && (
                  <section ref={homeSectionRef} className="min-h-screen bg-ui-bg-base">
                    <div className="flex justify-center px-4 pb-16 pt-[18vh]">
                      <div className="w-full max-w-xl">
                        <h1 className="mb-3 text-center text-4xl font-bold md:text-5xl">{t.homeTitle}</h1>
                        <p className="mb-8 text-center text-ui-fg-subtle">{t.homeSubtitle}</p>
                        <TireSearch
                          availableDimensions={availableDimensions}
                          dimensionCounts={dimensionCounts}
                          onSearch={handleSearch}
                          submitted={Boolean(searchMeta.dimension)}
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
                          onFieldMount={(fn) => {
                            setSearchFieldRef.current = fn
                          }}
                          onResetRef={(fn) => {
                            resetSearchRef.current = fn
                          }}
                          onRegisterApi={(api) => {
                            tireSearchRef.current = api
                          }}
                        />
                      </div>
                    </div>

                    {landingContent}
                    {!showResultsSection && landingFooter}
                  </section>
                )}

                {appState.flow !== "complete" && showResultsSection && (
                  <section
                    ref={resultsSectionRef}
                    className="min-h-screen scroll-mt-14 border-t border-ui-border-base bg-ui-bg-base"
                  >
                    <FlowShellResults
                      cart={cart}
                      hasMoreResults={hasMoreResults}
                      highlightedProductIds={highlightedProductIds}
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
                      onRegisterAgentCheckout={(api) => { agentCheckoutRef.current = api }}
                      onCheckoutStateChange={(step) => {
                        if (step === "complete") {
                          dispatch({ type: "BOOKING_CONFIRMED" })
                          return
                        }

                        dispatch({ type: "CHECKOUT_STEP_CHANGED", step })
                      }}
                      onStepTitle={setCheckoutStepTitle}
                      onRegisterBack={(fn) => {
                        checkoutBackRef.current = fn
                      }}
                      onBack={handleBack}
                      onConfirmationReached={() => {
                        setCheckoutStepTitle("")
                        dispatch({ type: "BOOKING_CONFIRMED" })
                      }}
                    />
                  </section>
                )}
              </div>

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

          <AgentPanel
            open={chatOpen}
            onClose={() => dispatch({ type: "ASSISTANT_CLOSED" })}
            getSessionContext={getSessionContext}
          />
        </div>
      </AgentToolContextProvider>
    </LanguageContext.Provider>
  )
}
