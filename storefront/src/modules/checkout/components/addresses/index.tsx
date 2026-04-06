"use client"

import { setAddresses, setAddressesInPanel } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
  step: stepProp,
  onStepChange,
  isWorkshop,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  step?: string
  onStepChange?: (step: string) => void
  isWorkshop?: boolean
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = stepProp ? stepProp === "address" : searchParams.get("step") === "address"

  // isWorkshop prop takes precedence (passed from parent with in-memory selected option);
  // fall back to cart.shipping_methods for the standalone /checkout page route
  const shippingMethodName = cart?.shipping_methods?.[0]?.name?.toLowerCase() ?? ""
  const isWorkshopOrder = isWorkshop !== undefined ? isWorkshop : shippingMethodName.includes("montering")

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    if (onStepChange) onStepChange("address")
    else router.push(pathname + "?step=address")
  }

  const panelAction = async (state: unknown, formData: FormData) => {
    const result = await setAddressesInPanel(state, formData)
    if (!result) onStepChange?.("payment")
    return result
  }
  const [message, formAction] = useActionState(
    onStepChange ? panelAction : setAddresses,
    null
  )

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          {isWorkshopOrder ? "Kundeopplysninger" : "Leveringsadresse"}
          {!isOpen && !!cart?.email && <CheckCircleSolid />}
        </Heading>
        {!isOpen && !!cart?.email && (
          <button
            onClick={handleEdit}
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-small-regular"
            data-testid="edit-address-button"
          >
            Endre
          </button>
        )}
      </div>
      {isOpen && (
        <form action={formAction}>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              isWorkshop={isWorkshopOrder}
            />

            {!sameAsBilling && !isWorkshopOrder && (
              <div>
                <Heading
                  level="h2"
                  className="text-3xl-regular gap-x-4 pb-6 pt-8"
                >
                  Fakturaadresse
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton className="mt-6" data-testid="submit-address-button">
              Fortsett til betaling
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
