"use client"

import { useState, useEffect, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/i18n"
import { initiatePaymentSession, retrieveCart, deleteLineItem, setShippingMethod } from "@lib/data/cart"
import { listCartPaymentMethods } from "@lib/data/payment"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { isStripeLike } from "@lib/constants"
import { getShippingZone, type ShippingZone } from "@lib/util/shipping-zones"
import { useRouter } from "next/navigation"

const SHOP_TYPE_CODES: Record<Shop, string> = {
  fjellhamar: "pickup-fjellhamar",
  drammen: "pickup-drammen",
  "home-delivery": "home-delivery",
}

type Shop = "fjellhamar" | "drammen" | "home-delivery"

const SHOPS: Record<"fjellhamar" | "drammen", { name: string; address: string; availabilityKey: "manySlots" | "slotsAvailable" }> = {
  fjellhamar: {
    name: "Fjellhamar",
    address: "Kloppaveien 16, 1472 Fjellhamar",
    availabilityKey: "manySlots",
  },
  drammen: {
    name: "Drammen",
    address: "Tordenskiolds gate 73, 3044 Drammen",
    availabilityKey: "slotsAvailable",
  },
}

export type SelectedTire = {
  product: HttpTypes.StoreProduct
  initialQty: number
  unitPrice: number
  currencyCode: string
  lineItemId?: string
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

export default function QuantityAndShop({
  tire,
  countryCode,
  onBack,
}: {
  tire: SelectedTire
  countryCode: string
  onBack: () => void
}) {
  const { t } = useLanguage()
  const [shop, setShop] = useState<Shop>("fjellhamar")
  const [postalCode, setPostalCode] = useState("")
  const [shippingZone, setShippingZone] = useState<ShippingZone | null>(null)
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [overlayHandle, setOverlayHandle] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Fetch actual cart on mount and when lineItemId is set (addToCart completed)
  useEffect(() => {
    retrieveCart().then((c) => setCart(c ?? null))
  }, [tire.lineItemId])

  const currencyCode = cart?.currency_code ?? tire.currencyCode

  const fmt = (amount: number) =>
    new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount)

  const shippingCost = shop === "home-delivery" && shippingZone ? shippingZone.price : 0
  const cartBaseTotal = cart?.total ?? (tire.initialQty * tire.unitPrice)
  const cartTotal = cartBaseTotal + shippingCost
  const cartItems = (cart?.items ?? []) as any[]

  const variant = (tire.product.variants?.[0] ?? {}) as any

  const shopLabel =
    shop === "fjellhamar" ? "Fjellhamar" :
    shop === "drammen" ? "Drammen" :
    "Hjemlevering"

  async function handleRemoveItem(lineId: string) {
    setRemovingId(lineId)
    await deleteLineItem(lineId)
    const updated = await retrieveCart()
    router.refresh()
    if (!updated || (updated.items?.length ?? 0) === 0) {
      onBack()
      return
    }
    setCart(updated)
    setRemovingId(null)
  }

  function handlePay() {
    if (!variant?.id) return
    startTransition(async () => {
      const cart = await retrieveCart()
      if (!cart) return

      // Auto-apply shipping method based on selected shop
      const shippingOptions = await listCartShippingMethods(cart.id)
      const targetCode = SHOP_TYPE_CODES[shop]
      const matchingOption = shippingOptions?.find(
        (o: any) => o.type?.code === targetCode
      )
      if (matchingOption) {
        await setShippingMethod({ cartId: cart.id, shippingMethodId: matchingOption.id })
      }

      // Initiate Stripe payment session if not already done
      const hasSession = cart.payment_collection?.payment_sessions?.some(
        (s: any) => isStripeLike(s.provider_id) && s.status === "pending"
      )
      if (!hasSession) {
        const methods = await listCartPaymentMethods(cart.region?.id ?? "")
        const stripeProvider = methods?.find((p) => isStripeLike(p.id))
        if (stripeProvider) {
          await initiatePaymentSession(cart, { provider_id: stripeProvider.id })
        }
      }

      // Always start at address; delivery step will show pre-filled selection
      router.push(`/${countryCode}/checkout?step=address`)
    })
  }

  return (
    <div className="flex min-h-screen flex-col pb-52">
      {/* Header */}
      <header className="flex items-center px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-ui-fg-base transition-colors hover:text-ui-fg-subtle"
        >
          ← Tilbake
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4">

        {/* H1 page heading */}
        <h1 className="text-3xl font-bold text-ui-fg-base">
          Hvor vil du montere?
        </h1>

        {/* Shop selector */}
        <div className="flex flex-col gap-3" role="radiogroup" aria-label={t.selectShop}>

          {(Object.entries(SHOPS) as [keyof typeof SHOPS, (typeof SHOPS)[keyof typeof SHOPS]][]).map(([id, info]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={shop === id}
              onClick={() => setShop(id)}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${
                shop === id
                  ? "border-red-600 bg-red-50"
                  : "border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ui-fg-base">{info.name}</p>
                  <p className="mt-0.5 text-sm text-ui-fg-subtle">{info.address}</p>
                  <p className="mt-1.5 text-xs text-green-700">✓ {t[info.availabilityKey]}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ui-fg-base">
                  {t.mountingIncl}
                </span>
              </div>
            </button>
          ))}

          {/* Home delivery */}
          <button
            type="button"
            role="radio"
            aria-checked={shop === "home-delivery"}
            onClick={() => setShop("home-delivery")}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              shop === "home-delivery"
                ? "border-red-600 bg-red-50"
                : "border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-ui-fg-base">{t.homeDelivery}</p>
                <p className="mt-0.5 text-sm text-ui-fg-subtle">
                  Leverer til din dør overalt i Norge. Fraktkostnad legges til.
                </p>

                {shop === "home-delivery" && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    {shippingZone ? (
                      /* Confirmed state — show price, "Endre" to re-edit */
                      <div className="flex items-center justify-between rounded-lg bg-ui-bg-base px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-ui-fg-base">
                            {postalCode} · {shippingZone.label}
                          </p>
                          <p className="text-xs text-ui-fg-muted">
                            {shippingZone.region} · Estimert {shippingZone.deliveryDays}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-ui-fg-base">
                            {fmt(shippingZone.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShippingZone(null)}
                            className="text-xs text-red-600 underline hover:text-red-700"
                          >
                            Endre
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Input state */
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder={t.postalCode}
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:border-red-500 focus:outline-none"
                            maxLength={4}
                            aria-label="Postnummer for hjemlevering"
                          />
                          {postalCode.length === 4 && (
                            <button
                              type="button"
                              onClick={() => setShippingZone(getShippingZone(postalCode))}
                              className="shrink-0 rounded-lg bg-ui-fg-base px-3 py-2 text-sm font-medium text-ui-bg-base transition-colors hover:opacity-80"
                            >
                              Beregn pris
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-ui-fg-muted">
                          {postalCode.length === 4
                            ? t.calcShipping
                            : t.orPayNow}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {shop !== "home-delivery" && (
                  <span className="mt-1.5 inline-block text-xs text-red-600 underline">
                    Legg til postnummer
                  </span>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-ui-fg-base">
                {shippingZone && shop === "home-delivery"
                  ? fmt(shippingZone.price)
                  : t.fromPrice}
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* Sticky footer — order summary + CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ui-border-base bg-ui-bg-base px-4 pb-6 pt-4">
        <div className="mx-auto w-full max-w-xl">

          {/* Order summary — all cart line items */}
          <div
            className="mb-3 rounded-xl bg-ui-bg-subtle px-4 py-3"
            aria-live="polite"
            aria-label="Ordresammendrag"
          >
            <p className="mb-2 text-xs text-ui-fg-muted">{t.yourOrder}</p>

            {cartItems.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {cartItems.map((item: any) => {
                  const title = item.product?.title ?? item.title ?? "Produkt"
                  const handle = item.product?.handle ?? null
                  const lineTotal = item.total ?? item.subtotal ?? 0
                  const isRemoving = removingId === item.id
                  return (
                    <div
                      key={item.id}
                      className={`group flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-ui-bg-base ${isRemoving ? "opacity-40" : ""}`}
                    >
                      {/* Name + trash inline, price right-aligned */}
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        {handle ? (
                          <button
                            type="button"
                            onClick={() => setOverlayHandle(handle)}
                            className="truncate text-left text-sm text-ui-fg-base underline-offset-2 hover:underline"
                          >
                            {item.quantity}× {title}
                          </button>
                        ) : (
                          <p className="truncate text-sm text-ui-fg-base">
                            {item.quantity}× {title}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isRemoving}
                          aria-label={`Fjern ${title}`}
                          className="ml-3 flex shrink-0 items-center gap-1 text-xs text-ui-fg-muted transition-colors hover:text-red-600 disabled:opacity-40 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <TrashIcon />
                          Fjern
                        </button>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ui-fg-base">
                        {fmt(lineTotal)}
                      </p>
                    </div>
                  )
                })}

                <div className="mt-1 flex items-baseline justify-between border-t border-ui-border-base pt-1.5">
                  <p className="text-sm font-semibold text-ui-fg-base">{t.total}</p>
                  <p className="text-sm font-bold text-ui-fg-base">{fmt(cartTotal)}</p>
                </div>
              </div>
            ) : (
              <p className="animate-pulse text-sm text-ui-fg-subtle">{t.loadingOrder}</p>
            )}

            {/* Shipping / mounting note */}
            {shop === "home-delivery" && shippingZone && (
              <div className="mt-1.5 flex items-baseline justify-between border-t border-ui-border-base pt-1.5">
                <p className="text-xs text-ui-fg-muted">{t.shipping} / {shippingZone.label}</p>
                <p className="text-xs font-semibold text-ui-fg-base">{fmt(shippingZone.price)}</p>
              </div>
            )}
            {shop === "home-delivery" && !shippingZone && (
              <p className="mt-1.5 text-xs text-ui-fg-muted">{t.shippingInCheckout}</p>
            )}
            {shop !== "home-delivery" && (
              <p className="mt-1.5 text-xs text-ui-fg-muted">{t.mountingIncl} / {shopLabel}</p>
            )}
          </div>

          {/* CTA */}
          <div className="flex md:justify-end">
            <button
              type="button"
              onClick={handlePay}
              disabled={isPending || !variant?.id}
              className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60 md:w-auto md:min-w-64 md:px-10"
              aria-label={t.payNow(fmt(cartTotal))}
            >
              {isPending ? t.waiting : t.payNow(fmt(cartTotal))}
            </button>
          </div>

        </div>
      </div>
      {/* Product page overlay */}
      {overlayHandle && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOverlayHandle(null)}
          />
          {/* Sheet — slides up from bottom */}
          <div className="relative mt-16 flex flex-1 flex-col overflow-hidden rounded-t-2xl bg-ui-bg-base shadow-2xl">
            {/* Sheet header */}
            <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
              <p className="text-sm font-medium text-ui-fg-base">{t.productDetails}</p>
              <button
                type="button"
                onClick={() => setOverlayHandle(null)}
                className="rounded-full p-1 text-ui-fg-muted hover:bg-ui-bg-subtle hover:text-ui-fg-base"
                aria-label={t.close}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* iframe */}
            <iframe
              src={`/${countryCode}/products/${overlayHandle}`}
              className="flex-1 border-0"
              title={t.productPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
