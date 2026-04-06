import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Booking from "@modules/checkout/components/booking"
import Payment from "@modules/checkout/components/payment"
import ScrollToStep from "@modules/checkout/components/scroll-to-step"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!paymentMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <ScrollToStep />
      <div id="step-delivery"><Shipping cart={cart} availableShippingMethods={shippingMethods} /></div>
      <div id="step-address"><Addresses cart={cart} customer={customer} /></div>
      <div id="step-payment"><Payment cart={cart} availablePaymentMethods={paymentMethods} /></div>
      <div id="step-booking"><Booking cart={cart} /></div>
    </div>
  )
}
