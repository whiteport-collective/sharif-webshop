"use client"

import { retrieveCart, retrieveCartFresh } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Booking from "@modules/checkout/components/booking"
import Payment from "@modules/checkout/components/payment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import Shipping from "@modules/checkout/components/shipping"
import CartTotals from "@modules/common/components/cart-totals"
import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@lib/i18n"

type Props = {
  countryCode: string
  onBack: () => void
  cartLoading?: boolean
  onStepTitle?: (title: string) => void
  onRegisterBack?: (fn: () => void) => void
  onSuccess?: (orderId: string) => void
  onConfirmationReached?: () => void
  supportOpen?: boolean
}

const STEP_TITLES: Record<string, string> = {
  delivery: "Leveringsmåte",
  payment: "Betaling",
  booking: "Bestill montering",
}

type CheckoutData = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: HttpTypes.StoreCartShippingOption[] | null
  paymentMethods: any[] | null
}

const STEP_BACK: Record<string, string | null> = {
  delivery: null,
  address: "delivery",
  payment: "address",
  booking: "payment",
}

export default function CheckoutPanelContent({ countryCode, onBack, cartLoading = false, onStepTitle, onRegisterBack, onSuccess, onConfirmationReached, supportOpen }: Props) {
  const [data, setData] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState("delivery")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null)
  const [cartSummaryOpen, setCartSummaryOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const backLocked = useRef(false)

  useEffect(() => {
    if (cartLoading) return // wait for parent addToCart to finish before fetching
    let cancelled = false
    setLoading(true)
    Promise.all([
      retrieveCart(),
      retrieveCustomer().catch(() => null),
    ]).then(async ([cart, customer]) => {
      if (!cart || cancelled) return
      const [shippingMethods, paymentMethods] = await Promise.all([
        listCartShippingMethods(cart.id),
        listCartPaymentMethods(cart.region?.id ?? ""),
      ])
      if (!cancelled) {
        setData({ cart, customer, shippingMethods, paymentMethods })
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [cartLoading])

  const handleStepChange = (next: string) => {
    setStep(next)
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Derive isWorkshop early — needed both for header sync and render
  const selectedOption = data?.shippingMethods?.find((m) => m.id === selectedShippingOptionId)
  const isWorkshop = selectedOption
    ? selectedOption.name?.toLowerCase().includes("montering") ?? false
    : data?.cart?.shipping_methods?.[0]?.name?.toLowerCase().includes("montering") ?? false

  // Sync step title and back function to parent header
  useEffect(() => {
    if (orderId) return
    const addressTitle = isWorkshop ? "Kundeopplysninger" : "Leveringsadresse"
    const title = step === "address" ? addressTitle : (STEP_TITLES[step] ?? "Kasse")
    onStepTitle?.(title)
    onRegisterBack?.(() => goBackRef.current())
  }, [step, isWorkshop, orderId])

  // Called after initiatePaymentSession — fetches fresh cart so PaymentWrapper
  // gets the new payment_session and renders Stripe Elements
  const handleCartUpdate = async () => {
    const cart = await retrieveCartFresh()
    if (cart) setData((prev) => prev ? { ...prev, cart } : null)
  }

  // Order placed — show confirmation inside panel, notify FlowShell to hide back button
  const handleOrderSuccess = (id: string) => {
    setOrderId(id)
    onSuccess?.(id)
    onConfirmationReached?.()
    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const goBack = () => {
    if (backLocked.current || orderId) return
    backLocked.current = true
    setTimeout(() => { backLocked.current = false }, 600)
    const prev = STEP_BACK[step]
    if (prev === null || prev === undefined) onBack()
    else setStep(prev)
  }

  // Wheel: use ref so handler always sees current step/orderId without re-registering
  const goBackRef = useRef(goBack)
  goBackRef.current = goBack

  // Scroll-up at top → go back. Uses React onWheel prop (more reliable than addEventListener
  // on children of CSS-transformed elements, where some browsers delay or drop events).
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el || (el.scrollTop ?? 0) > 0) return
    if (e.deltaY < -40) goBackRef.current()
  }

  // Touch: keep as addEventListener so passive:true avoids scroll jank on mobile
  useEffect(() => {
    const el = containerRef.current
    if (!el || orderId) return

    const atTop = () => (el.scrollTop ?? 0) <= 0

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!atTop()) return
      if (e.touches[0].clientY - touchStartY.current > 60) goBackRef.current()
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
    }
  }, [orderId])

  return (
    <div ref={containerRef} className="h-full overflow-y-auto" onWheel={handleWheel}>
      {loading || !data ? (
        <CheckoutSkeleton />
      ) : (
        <>
          {/* Cart summary — collapsible, shown above steps */}
          {!orderId && (
            <div className="border-b border-ui-border-base">
              <button
                type="button"
                onClick={() => setCartSummaryOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  Handlekurv
                  {(data.cart.items?.length ?? 0) > 0 && (
                    <span className="text-xs text-ui-fg-muted">
                      ({data.cart.items?.reduce((s, i) => s + i.quantity, 0)} stk)
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-ui-fg-muted">
                  <span className="text-ui-fg-base font-semibold">
                    {data.cart.total != null
                      ? new Intl.NumberFormat("nb-NO", { style: "currency", currency: data.cart.currency_code }).format(data.cart.total / 100)
                      : ""}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${cartSummaryOpen ? "rotate-180" : ""}`}>
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              {cartSummaryOpen && (
                <div className="px-4 pb-4">
                  <ItemsPreviewTemplate cart={data.cart} />
                  <div className="mt-4">
                    <CartTotals totals={data.cart} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checkout steps — hidden (but kept mounted) once order is placed */}
          <div className={orderId ? "hidden" : undefined}>
            <PaymentWrapper cart={data.cart}>
              <div className="w-full max-w-2xl mx-auto px-4 py-8 grid grid-cols-1 gap-y-8">
                <Shipping
                  cart={data.cart}
                  availableShippingMethods={data.shippingMethods}
                  step={step}
                  onStepChange={handleStepChange}
                  onShippingMethodChange={setSelectedShippingOptionId}
                />
                <Addresses
                  cart={data.cart}
                  customer={data.customer}
                  step={step}
                  onStepChange={handleStepChange}
                  isWorkshop={isWorkshop}
                />
                {data.paymentMethods && (
                  <Payment
                    cart={data.cart}
                    availablePaymentMethods={data.paymentMethods}
                    step={step}
                    onStepChange={handleStepChange}
                    onSuccess={handleOrderSuccess}
                    onCartUpdate={handleCartUpdate}
                  />
                )}
                <Booking
                  cart={data.cart}
                  step={step}
                  onStepChange={handleStepChange}
                  onSuccess={handleOrderSuccess}
                  isWorkshop={isWorkshop}
                />
              </div>
            </PaymentWrapper>
          </div>

          {/* Confirmation panel — scrolled into view after order placed */}
          <div ref={confirmationRef}>
            {orderId && (
              <OrderConfirmedInline
                orderId={orderId}
                countryCode={countryCode}
                cart={data.cart}
                isWorkshop={isWorkshop}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ui-bg-subtle ${className ?? ""}`} />
}

function CheckoutSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 grid grid-cols-1 gap-y-8">

      {/* Section: Leveringsmåte */}
      <div className="bg-white">
        <div className="mb-6">
          <SkeletonBox className="h-8 w-48" />
        </div>
        <div className="flex flex-col gap-2 pb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-rounded border border-ui-border-base px-8 py-4"
            >
              <div className="flex items-center gap-x-4">
                <div className="w-4 h-4 rounded-full border-2 border-ui-border-base flex-none animate-pulse" />
                <SkeletonBox className="h-4 w-40" />
              </div>
              <SkeletonBox className="h-4 w-20" />
            </div>
          ))}
        </div>
        <SkeletonBox className="h-11 w-32 rounded-lg" />
        <div className="mt-8 h-px bg-ui-border-base" />
      </div>

      {/* Section: Leveringsadresse */}
      <div className="bg-white">
        <div className="mb-6">
          <SkeletonBox className="h-8 w-52" />
        </div>
        <div className="grid grid-cols-2 gap-4 pb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={i === 5 || i === 6 ? "col-span-2" : ""}>
              <SkeletonBox className="h-4 w-24 mb-1" />
              <SkeletonBox className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <SkeletonBox className="h-11 w-full rounded-lg mt-2" />
        <div className="mt-8 h-px bg-ui-border-base" />
      </div>

      {/* Section: Payment */}
      <div className="bg-white opacity-40">
        <div className="mb-6">
          <SkeletonBox className="h-8 w-24" />
        </div>
        <div className="mt-8 h-px bg-ui-border-base" />
      </div>

    </div>
  )
}

// ─── Inline confirmation screen ───────────────────────────────────────────────

function OrderConfirmedInline({
  orderId,
  countryCode,
  cart,
  isWorkshop,
}: {
  orderId: string
  countryCode: string
  cart: HttpTypes.StoreCart
  isWorkshop: boolean
}) {
  const { t } = useLanguage()
  const bookingDate = cart.metadata?.booking_date ? String(cart.metadata.booking_date) : undefined
  const bookingTime = cart.metadata?.booking_time ? String(cart.metadata.booking_time) : undefined
  const bookingWorkshop = cart.metadata?.booking_workshop ? String(cart.metadata.booking_workshop) : undefined

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-white text-center">
      {/* Big checkmark */}
      <div className="mb-8 flex items-center justify-center w-20 h-20 rounded-full bg-green-50">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-ui-fg-base mb-2">{t.thankYou}</h1>
      <p className="text-ui-fg-subtle mb-1">{t.orderNumber} <span className="font-medium text-ui-fg-base">{orderId.slice(-8).toUpperCase()}</span></p>
      <p className="text-sm text-ui-fg-muted mb-8">{t.confirmationEmail}</p>

      {/* Booking summary */}
      {isWorkshop && bookingDate && bookingTime && (
        <div className="w-full max-w-xs rounded-xl border border-ui-border-base bg-ui-bg-subtle p-5 mb-8 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted mb-2">{t.mountingTime}</p>
          <p className="text-base font-semibold text-ui-fg-base">{bookingWorkshop}</p>
          <p className="text-sm text-ui-fg-subtle">{bookingDate}, kl. {bookingTime}</p>
        </div>
      )}

      <a
        href={`/${countryCode}`}
        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Tilbake til forsiden
      </a>
    </div>
  )
}
