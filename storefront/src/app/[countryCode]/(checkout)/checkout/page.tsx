import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Betaling — Sharif",
}

export default async function Checkout({
  searchParams,
  params,
}: {
  searchParams: Promise<{ step?: string }>
  params: Promise<{ countryCode: string }>
}) {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const { step } = await searchParams
  const { countryCode } = await params

  if (!step) {
    redirect(`/${countryCode}/checkout?step=delivery`)
  }

  const customer = await retrieveCustomer().catch(() => null)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-x-8 gap-y-8">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <div className="md:sticky md:top-8 h-fit">
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
