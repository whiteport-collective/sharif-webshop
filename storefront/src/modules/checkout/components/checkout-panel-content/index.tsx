"use client"

import { retrieveCart, retrieveCartFresh } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import type { AddressDraftSnapshot } from "@modules/checkout/components/addresses"
import Booking from "@modules/checkout/components/booking"
import type { BookingSnapshot } from "@modules/checkout/components/booking"
import Payment from "@modules/checkout/components/payment"
import PaymentButton from "@modules/checkout/components/payment-button"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import Shipping from "@modules/checkout/components/shipping"
import CartTotals from "@modules/common/components/cart-totals"
import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLanguage } from "@lib/i18n"

export type CheckoutSnapshot = {
  step: "delivery" | "address" | "payment" | "booking" | "confirmation"
  deliveryType: "workshop" | "home" | null
  address: AddressDraftSnapshot | null
  shippingMethods: { id: string; name: string; price: number }[]
  selectedShippingMethodId: string | null
  bookingSlots: { id: string; label: string }[]
  selectedBookingSlotId: string | null
}

export type AgentCheckoutAPI = {
  advanceStep: () => { ok: boolean; step?: string; reason?: string }
  getState: () => {
    ok: boolean
    step: string
    availableShippingMethods: { id: string; name: string; price: number }[]
    cartTotal: number | null
  }
  prefillField: (field: string, value: string) => { ok: boolean; reason?: string }
  getSnapshot: () => CheckoutSnapshot
}

const AGENT_ADDRESS_FIELD_MAP: Record<string, string> = {
  first_name: "shipping_address.first_name",
  last_name: "shipping_address.last_name",
  address: "shipping_address.address_1",
  city: "shipping_address.city",
  postal_code: "shipping_address.postal_code",
  phone: "shipping_address.phone",
  email: "email",
}

type Props = {
  countryCode: string
  embedded?: boolean
  isActive?: boolean
  onBack: () => void
  cartLoading?: boolean
  onCheckoutStateChange?: (step: string) => void
  onStepTitle?: (title: string) => void
  onRegisterBack?: (fn: () => void) => void
  onRegisterAgentCheckout?: (api: AgentCheckoutAPI) => void
  onSuccess?: (orderId: string) => void
  onConfirmationReached?: () => void
  chatOpen?: boolean
}

const STEP_TITLES: Record<string, string> = {
  delivery: "Leveringsmåte",
  payment: "Betaling",
  booking: "Bestill montering",
  confirmation: "Bekreft bestilling",
}

const STEP_SLUGS: Record<string, string> = {
  delivery: "leveringsmate",
  address: "adresse",
  payment: "betaling",
  booking: "montering",
  confirmation: "bekreft",
}

type CheckoutData = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: HttpTypes.StoreCartShippingOption[] | null
  paymentMethods: any[] | null
}

export default function CheckoutPanelContent({
  countryCode,
  embedded = false,
  isActive = true,
  onBack,
  cartLoading = false,
  onCheckoutStateChange,
  onStepTitle,
  onRegisterBack,
  onRegisterAgentCheckout,
  onSuccess,
  onConfirmationReached,
  chatOpen,
}: Props) {
  const [data, setData] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState("delivery")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null)
  const [addressSnapshot, setAddressSnapshot] = useState<AddressDraftSnapshot | null>(null)
  const [bookingSnapshot, setBookingSnapshot] = useState<BookingSnapshot>({
    bookingSlots: [],
    selectedBookingSlotId: null,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const backLocked = useRef(false)
  const justMounted = useRef(true)

  // Ignore wheel-back gestures for 800ms after mount — prevents elastic overscroll
  // from the scroll-to-checkout animation from immediately triggering goBack.
  useEffect(() => {
    const timer = setTimeout(() => { justMounted.current = false }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Replace the FlowShell checkout-entry state with the first checkout step hash.
  useEffect(() => {
    const base = `${window.location.pathname}${window.location.search}`
    history.replaceState({ checkoutStep: "delivery", flowView: "checkout" }, "", `${base}#leveringsmate`)
  }, [])

  // Sync browser back/forward within checkout steps.
  useEffect(() => {
    const handler = (event: PopStateEvent) => {
      const checkoutStep = event.state?.checkoutStep as string | undefined
      if (!checkoutStep || orderId) return
      setStep(checkoutStep)
      onCheckoutStateChange?.(checkoutStep)
    }
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [orderId, onCheckoutStateChange])

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
    const slug = STEP_SLUGS[next]
    if (slug) {
      const base = `${window.location.pathname}${window.location.search}`
      history.pushState({ checkoutStep: next, flowView: "checkout" }, "", `${base}#${slug}`)
    }
    setStep(next)
    onCheckoutStateChange?.(next)
    if (!embedded) {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
    // In embedded mode, FlowShell owns scrolling — avoid scrollIntoView,
    // which can collide with the outer surface's scroll and with Stripe
    // Elements' iframe layout when the credit card field loads.
  }

  // Derive isWorkshop early — needed both for header sync and render
  const selectedOption = data?.shippingMethods?.find((m) => m.id === selectedShippingOptionId)
  const isWorkshop = selectedOption
    ? selectedOption.name?.toLowerCase().includes("montering") ?? false
    : data?.cart?.shipping_methods?.[0]?.name?.toLowerCase().includes("montering") ?? false
  const confirmedShippingMethodId = data?.cart?.shipping_methods?.at(-1)?.shipping_option_id ?? null

  useEffect(() => {
    if (confirmedShippingMethodId) {
      setSelectedShippingOptionId(confirmedShippingMethodId)
    }
  }, [confirmedShippingMethodId])

  // Sync step title and back function to parent header
  useEffect(() => {
    if (orderId) return
    const addressTitle = isWorkshop ? "Kundeopplysninger" : "Leveringsadresse"
    const title = step === "address" ? addressTitle : (STEP_TITLES[step] ?? "Kasse")
    onStepTitle?.(title)
    onRegisterBack?.(() => goBackRef.current())
    onCheckoutStateChange?.(step)
  }, [step, isWorkshop, onCheckoutStateChange, onRegisterBack, onStepTitle, orderId])

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
    onCheckoutStateChange?.("complete")
    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const goBack = () => {
    if (backLocked.current || orderId) return
    backLocked.current = true
    setTimeout(() => { backLocked.current = false }, 600)
    history.back()
  }

  // Wheel: use ref so handler always sees current step/orderId without re-registering
  const goBackRef = useRef(goBack)
  goBackRef.current = goBack

  // Agent checkout API — exposed via onRegisterAgentCheckout for flow-shell handlers
  useEffect(() => {
    if (!onRegisterAgentCheckout) return

    const workshopSteps = ["delivery", "address", "booking", "confirmation"]
    const standardSteps = ["delivery", "address", "payment"]

    const advanceStep: AgentCheckoutAPI["advanceStep"] = () => {
      const steps = isWorkshop ? workshopSteps : standardSteps
      const idx = steps.indexOf(step)
      if (idx < 0 || idx >= steps.length - 1) {
        return { ok: false, reason: `Already at final step: ${step}` }
      }
      const next = steps[idx + 1]
      handleStepChange(next)
      return { ok: true, step: next }
    }

    const getState: AgentCheckoutAPI["getState"] = () => ({
      ok: true,
      step,
      availableShippingMethods: (data?.shippingMethods ?? []).map((m) => ({
        id: m.id,
        name: m.name ?? "",
        price: (m as any).amount ?? 0,
      })),
      cartTotal: data?.cart.total ?? null,
    })

    const getSnapshot: AgentCheckoutAPI["getSnapshot"] = () => ({
      step: (step === "delivery" ||
      step === "address" ||
      step === "payment" ||
      step === "booking" ||
      step === "confirmation"
        ? step
        : "delivery"),
      deliveryType: selectedOption || data?.cart?.shipping_methods?.[0]?.name
        ? isWorkshop
          ? "workshop"
          : "home"
        : null,
      address: addressSnapshot,
      shippingMethods: (data?.shippingMethods ?? []).map((m) => ({
        id: m.id,
        name: m.name ?? "",
        price: (m as any).amount ?? 0,
      })),
      selectedShippingMethodId: confirmedShippingMethodId ?? selectedShippingOptionId ?? null,
      bookingSlots: bookingSnapshot.bookingSlots,
      selectedBookingSlotId: bookingSnapshot.selectedBookingSlotId,
    })

    const prefillField: AgentCheckoutAPI["prefillField"] = (field, value) => {
      const domName = AGENT_ADDRESS_FIELD_MAP[field]
      if (!domName) {
        return { ok: false, reason: `Unknown field: ${field}` }
      }
      const container = containerRef.current
      if (!container) return { ok: false, reason: "Checkout container not mounted" }
      const input = container.querySelector<HTMLInputElement>(`[name="${domName}"]`)
      if (!input) return { ok: false, reason: `Field not visible in current step: ${field}` }

      const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
      nativeSet?.call(input, value)
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))

      // Amber pulse
      input.classList.add("ring-2", "ring-amber-400", "transition-shadow")
      setTimeout(() => input.classList.remove("ring-2", "ring-amber-400", "transition-shadow"), 1200)

      return { ok: true }
    }

    onRegisterAgentCheckout({ advanceStep, getState, prefillField, getSnapshot })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addressSnapshot,
    bookingSnapshot,
    confirmedShippingMethodId,
    data,
    isWorkshop,
    onRegisterAgentCheckout,
    selectedOption,
    selectedShippingOptionId,
    step,
  ])

  // Scroll-up at top → go back. Uses React onWheel prop (more reliable than addEventListener
  // on children of CSS-transformed elements, where some browsers delay or drop events).
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (justMounted.current || !isActive) return
    const el = containerRef.current
    if (!el || (el.scrollTop ?? 0) > 0) return
    if (e.deltaY < -40) goBackRef.current()
  }

  // Touch: keep as addEventListener so passive:true avoids scroll jank on mobile
  useEffect(() => {
    const el = containerRef.current
    if (!el || orderId || !isActive || embedded) return

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
  }, [embedded, isActive, orderId])

  return (
    <div
      ref={containerRef}
      className={embedded ? "bg-ui-bg-base" : "h-full overflow-y-auto bg-ui-bg-base"}
      onWheel={!embedded && isActive ? handleWheel : undefined}
    >
      {loading || !data ? (
        <CheckoutSkeleton />
      ) : (
        <>
          {/* Two-column layout: steps/confirmation left, cart summary right (desktop) */}
          <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-x-8 gap-y-8">
            {/* Left column */}
            {orderId ? (
              <div ref={confirmationRef} className="scroll-mt-14">
                <OrderConfirmedInline
                  orderId={orderId}
                  countryCode={countryCode}
                  cart={data.cart}
                  isWorkshop={isWorkshop}
                />
              </div>
            ) : (
              <PaymentWrapper cart={data.cart}>
                <div className="grid grid-cols-1 gap-y-8">
                  <Shipping
                    cart={data.cart}
                    availableShippingMethods={data.shippingMethods}
                    step={step}
                    onStepChange={handleStepChange}
                    onShippingMethodChange={async (id) => {
                      setSelectedShippingOptionId(id)
                      const freshCart = await retrieveCartFresh()
                      if (freshCart) {
                        setData((prev) => (prev ? { ...prev, cart: freshCart } : prev))
                      }
                    }}
                  />
                  <Addresses
                    cart={data.cart}
                    customer={data.customer}
                    step={step}
                    onStepChange={handleStepChange}
                    isWorkshop={isWorkshop}
                    onSnapshotChange={setAddressSnapshot}
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
                    isWorkshop={isWorkshop}
                    shippingMethodName={selectedOption?.name ?? data.cart?.shipping_methods?.[0]?.name}
                    onSnapshotChange={setBookingSnapshot}
                  />
                  {isWorkshop && (
                    <ConfirmationStep
                      cart={data.cart}
                      step={step}
                      onSuccess={handleOrderSuccess}
                    />
                  )}
                </div>
              </PaymentWrapper>
            )}

            {/* Right: cart summary — sticky sidebar on desktop */}
            <div className="md:sticky md:top-8 h-fit">
              <div className="bg-white rounded-lg border border-ui-border-base p-6">
                <h3 className="text-lg font-semibold text-ui-fg-base mb-4">Handlekurv</h3>
                <ItemsPreviewTemplate cart={data.cart} />
                <div className="mt-4 pt-4 border-t border-ui-border-base">
                  <CartTotals totals={data.cart} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Confirmation step ────────────────────────────────────────────────────────

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-ui-fg-muted mb-0.5">{label}</p>
      <p className={`text-sm text-ui-fg-base${bold ? " font-semibold" : ""}`}>{value}</p>
    </div>
  )
}

function ConfirmationStep({
  cart,
  step,
  onSuccess,
}: {
  cart: HttpTypes.StoreCart
  step: string
  onSuccess: (orderId: string) => void
}) {
  const isOpen = step === "confirmation"

  const shippingMethod = cart.shipping_methods?.[0]
  const addr = cart.shipping_address
  const bookingDate = cart.metadata?.booking_date ? String(cart.metadata.booking_date) : null
  const bookingTime = cart.metadata?.booking_time ? String(cart.metadata.booking_time) : null
  const bookingWorkshop = cart.metadata?.booking_workshop ? String(cart.metadata.booking_workshop) : null
  const total = cart.total != null
    ? `NOK ${(cart.total / 100).toFixed(2).replace(".", ",")}`
    : "—"

  return (
    <div className="bg-white">
      <Heading
        level="h2"
        className={`flex flex-row text-3xl-regular gap-x-2 items-baseline mb-6${
          !isOpen ? " opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        Bekreft bestilling
      </Heading>

      {isOpen && (
        <>
          <div className="divide-y divide-ui-border-base border border-ui-border-base rounded-lg overflow-hidden mb-8">
            <SummaryRow label="Leveringsmåte" value={shippingMethod?.name ?? "—"} />
            {addr && (
              <SummaryRow
                label="Adresse"
                value={[addr.address_1, addr.postal_code, addr.city].filter(Boolean).join(", ")}
              />
            )}
            {bookingDate && (
              <SummaryRow
                label="Monteringstid"
                value={[
                  bookingDate,
                  bookingTime ? `kl. ${bookingTime}` : null,
                  bookingWorkshop,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
            <SummaryRow label="Totalbeløp" value={total} bold />
          </div>

          <div className="pb-8">
            <PaymentButton
              cart={cart}
              data-testid="submit-order-button"
              onSuccess={onSuccess}
              buttonLabel="Bekreft og betal"
            />
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

function CompletedStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 text-green-600 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-semibold text-ui-fg-base">{title}</span>
      </div>
      <div className="ml-7 text-sm text-ui-fg-subtle">{children}</div>
    </div>
  )
}

function RegistrationPlate({ regNr }: { regNr: string }) {
  return (
    <div className="inline-flex items-stretch border border-gray-400 rounded overflow-hidden mt-1">
      <div className="w-[23px] bg-[#1864ab] flex items-center justify-center">
        <span className="text-white text-[10px] font-bold">N</span>
      </div>
      <div className="px-3 py-1 bg-white">
        <span className="font-mono text-base font-bold tracking-wider text-gray-900">{regNr}</span>
      </div>
    </div>
  )
}

function StarRating({
  rating,
  onRate,
}: {
  rating: number
  onRate: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="text-4xl transition-colors focus:outline-none"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(n)}
        >
          <span className={(hover || rating) >= n ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

type ChatMessage = { role: "user" | "assistant"; content: string }

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
  const [rating, setRating] = useState(0)
  const [ratingCollapsed, setRatingCollapsed] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const bookingDate = cart.metadata?.booking_date ? String(cart.metadata.booking_date) : undefined
  const bookingTime = cart.metadata?.booking_time ? String(cart.metadata.booking_time) : undefined
  const bookingWorkshop = cart.metadata?.booking_workshop ? String(cart.metadata.booking_workshop) : undefined
  const regNr = (cart.metadata?.car_registration || cart.metadata?.registration_number)
    ? String(cart.metadata.car_registration || cart.metadata.registration_number)
    : undefined

  // Shipping method name + price
  const shippingMethod = cart.shipping_methods?.[0]
  const shippingName = shippingMethod?.name ?? ""
  const shippingPrice = shippingMethod?.total != null
    ? `NOK ${(shippingMethod.total / 100).toFixed(2).replace(".", ",")}`
    : "NOK 0,00"

  // Customer info
  const addr = cart.shipping_address
  const customerName = addr ? `${addr.first_name ?? ""} ${addr.last_name ?? ""}`.trim() : ""
  const customerEmail = cart.email ?? ""
  const customerPhone = addr?.phone ?? ""

  // Short order ID
  const shortOrderId = orderId.slice(-4).toUpperCase()

  // Rating collapse after tap
  const handleRate = useCallback((n: number) => {
    setRating(n)
    setTimeout(() => setRatingCollapsed(true), 1000)
  }, [])

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Send chat message
  const handleSendChat = useCallback(async () => {
    const msg = chatInput.trim()
    if (!msg || chatSending) return
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: msg }])
    setChatSending(true)
    try {
      const res = await fetch(`/api/dialog/${orderId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "..." }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Beklager, noe gikk galt. Prøv igjen." }])
    } finally {
      setChatSending(false)
    }
  }, [chatInput, chatSending, orderId])

  return (
    <div>
      {/* ── Collapsed completed steps ── */}
      <div className="divide-y divide-ui-border-base">
        {/* Step 1: Delivery */}
        <CompletedStep title={t.deliveryMethod}>
          {shippingName} {shippingPrice}
        </CompletedStep>

        {/* Step 2: Customer details */}
        <CompletedStep title={t.customerDetails}>
          <div className="flex justify-between items-start">
            <div>
              <div>{customerName}</div>
              <div>{customerEmail} {customerPhone}</div>
            </div>
            {regNr && <RegistrationPlate regNr={regNr} />}
          </div>
        </CompletedStep>

        {/* Step 3: Payment */}
        <CompletedStep title={t.payment}>
          {t.paymentSuccessful}
        </CompletedStep>

        {/* Step 4: Mounting time (workshop only) */}
        {isWorkshop && bookingDate && (
          <CompletedStep title={t.mountingTimeStep}>
            <div>{bookingDate}{bookingTime ? `, kl. ${bookingTime}` : ""}</div>
            {bookingWorkshop && <div>{bookingWorkshop}</div>}
          </CompletedStep>
        )}

        {/* Collapsed rating widget (appears after rating) */}
        {ratingCollapsed && (
          <div
            className="py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setRatingCollapsed(false)}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-ui-fg-base">
                {t.thankYou} {"★".repeat(rating)}{"☆".repeat(5 - rating)}
              </span>
            </div>
            <div className="ml-7 text-xs text-ui-fg-muted">
              {t.orderNumber} #{shortOrderId} — {t.confirmationEmail}
            </div>
          </div>
        )}
      </div>

      {/* ── Celebration + Rating (visible until collapsed) ── */}
      {!ratingCollapsed && (
        <div className="mt-6 mb-6">
          <div className="border-t-[3px] border-ui-fg-base pt-6" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ui-fg-base mb-1">{t.thankYou}</h2>
            <p className="text-sm text-ui-fg-muted mb-6">
              {t.orderNumber} #{shortOrderId} — {t.confirmationEmail}
            </p>
            <p className="text-[15px] text-ui-fg-base mb-3">{t.howWasExperience}</p>
            <div className="flex justify-center">
              <StarRating rating={rating} onRate={handleRate} />
            </div>
          </div>
        </div>
      )}

      {/* ── AI Chat ── */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-ui-fg-base mb-3">{t.talkToAI}</p>

        {/* Chat messages */}
        {chatMessages.length > 0 && (
          <div className="mb-3 space-y-3 max-h-80 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-800 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
                  ...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className="border border-[#ced4da] rounded-xl overflow-hidden">
          <textarea
            className="w-full px-4 py-3 text-sm resize-none focus:outline-none"
            rows={3}
            placeholder={t.chatPlaceholder}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendChat()
              }
            }}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#ced4da]">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSendChat}
              disabled={chatSending || !chatInput.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
            >
              <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
