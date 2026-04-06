"use client"

import { useState, useContext, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import { updateCart, placeOrder } from "@lib/data/cart"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"
import { convertToLocale } from "@lib/util/money"

export default function SharifCheckoutForm({
  cart,
}: {
  cart: HttpTypes.StoreCart
}) {
  const stripe = useStripe()
  const elements = useElements()
  const stripeReady = useContext(StripeContext)

  const [email, setEmail] = useState(cart.email ?? "")
  const [cardComplete, setCardComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const item = cart.items?.[0]
  const total = cart.total ?? 0
  const currencyCode = cart.currency_code?.toUpperCase() ?? "NOK"

  const fmt = (amount: number) =>
    convertToLocale({ amount, currency_code: currencyCode, locale: "nb-NO", maximumFractionDigits: 0 })

  const session = cart.payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending"
  )

  const cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
        color: "#1f2937",
        "::placeholder": { color: "#9ca3af" },
      },
    },
    classes: {
      base: "w-full",
    },
  }

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements || !session) return
    const card = elements.getElement("card")
    if (!card) return

    setSubmitting(true)
    setError(null)

    try {
      if (email) {
        await updateCart({ email })
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        session.data.client_secret as string,
        {
          payment_method: {
            card,
            billing_details: { email: email || undefined },
          },
        }
      )

      if (stripeError) {
        const pi = stripeError.payment_intent
        if (pi?.status === "requires_capture" || pi?.status === "succeeded") {
          await placeOrder()
        } else {
          setError(stripeError.message ?? "Betalingsfeil. Prøv igjen.")
          setSubmitting(false)
        }
        return
      }

      if (
        paymentIntent?.status === "requires_capture" ||
        paymentIntent?.status === "succeeded"
      ) {
        await placeOrder()
      }
    } catch (err: any) {
      setError(err.message ?? "Noe gikk galt. Prøv igjen.")
      setSubmitting(false)
    }
  }, [stripe, elements, session, email])

  const canSubmit = stripeReady && cardComplete && !submitting && !!session

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8">

      {/* Order summary */}
      {item && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
            Din bestilling
          </h2>
          <div className="rounded-xl bg-ui-bg-subtle p-4 flex flex-col gap-1">
            <p className="font-semibold text-ui-fg-base">{item.title ?? item.product_title}</p>
            <p className="text-sm text-ui-fg-subtle">
              {item.quantity} stk × {fmt(item.unit_price ?? 0)}
            </p>
            <p className="mt-1 text-xl font-bold text-ui-fg-base">
              Totalt: {fmt(total)}
            </p>
          </div>
        </section>
      )}

      {/* Email */}
      <section>
        <label
          htmlFor="checkout-email"
          className="mb-1.5 block text-sm font-medium text-ui-fg-base"
        >
          E-post
        </label>
        <input
          id="checkout-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="harriet@eksempel.no"
          autoComplete="email"
          className="w-full rounded-lg border border-ui-border-base bg-white px-4 py-3 text-base text-ui-fg-base placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none transition-colors"
        />
      </section>

      {/* Card */}
      <section>
        <p className="mb-1.5 text-sm font-medium text-ui-fg-base">Kortbetaling</p>
        {stripeReady ? (
          <div className="rounded-lg border border-ui-border-base bg-white px-4 py-3.5 focus-within:border-ui-border-interactive transition-colors">
            <CardElement
              options={cardOptions}
              onChange={(e) => {
                setCardComplete(e.complete)
                if (e.error) setError(e.error.message)
                else setError(null)
              }}
            />
          </div>
        ) : (
          <div className="h-12 rounded-lg border border-ui-border-base bg-ui-bg-subtle animate-pulse" />
        )}
      </section>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Behandler…" : `Betal nå — ${fmt(total)}`}
      </button>

      {/* Trust signal */}
      <p className="text-center text-xs text-ui-fg-muted">
        🔒 Sikker betaling via Stripe
      </p>

    </div>
  )
}
