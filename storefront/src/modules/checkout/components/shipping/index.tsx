"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
  step?: string
  onStepChange?: (step: string) => void
  onShippingMethodChange?: (id: string) => void
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) return ""
  const parts: string[] = []
  if (address.address_1) parts.push(address.address_1)
  if (address.postal_code) parts.push(`${address.postal_code} ${address.city}`)
  return parts.join(", ")
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
  step: stepProp,
  onStepChange,
  onShippingMethodChange,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = stepProp ? stepProp === "delivery" : searchParams.get("step") === "delivery"

  // Pickup methods (workshops) shown first, then shipping methods (home delivery)
  // Detect by type.code or by name containing "montering" as fallback
  const isPickupOption = (sm: HttpTypes.StoreCartShippingOption) => {
    const typeCode = (sm as any).type?.code as string | undefined
    if (typeCode) return typeCode.startsWith("pickup-")
    return sm.name?.toLowerCase().includes("montering")
  }
  const pickupMethods = availableShippingMethods?.filter(isPickupOption) ?? []
  const shippingMethods = availableShippingMethods?.filter((sm) => !isPickupOption(sm)) ?? []

  // All options in display order: workshops first, home delivery last
  const allOptions = [...pickupMethods, ...shippingMethods]

  // Auto-select Drammen if no option currently selected
  useEffect(() => {
    if (!availableShippingMethods || shippingMethodId) return
    const drammen = availableShippingMethods.find((sm) =>
      sm.name?.toLowerCase().includes("drammen")
    )
    if (drammen) {
      handleSetShippingMethod(drammen.id)
    }
  }, [availableShippingMethods])

  useEffect(() => {
    setIsLoadingPrices(true)
    const calculated = shippingMethods.filter((sm) => sm.price_type === "calculated")
    if (calculated.length) {
      Promise.allSettled(
        calculated.map((sm) => calculatePriceForShippingOption(sm.id, cart.id))
      ).then((res) => {
        const map: Record<string, number> = {}
        res.filter((r) => r.status === "fulfilled").forEach((p) => {
          map[p.value?.id || ""] = p.value?.amount!
        })
        setCalculatedPricesMap(map)
        setIsLoadingPrices(false)
      })
    } else {
      setIsLoadingPrices(false)
    }
  }, [availableShippingMethods])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const handleEdit = () => {
    if (onStepChange) onStepChange("delivery")
    else router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    if (onStepChange) onStepChange("address")
    else router.push(pathname + "?step=address", { scroll: false })
  }

  const handleSetShippingMethod = async (id: string) => {
    setError(null)
    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })
    onShippingMethodChange?.(id)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }

  const selectedMethod = cart.shipping_methods?.at(-1)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Leveringsmåte
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && <CheckCircleSolid />}
        </Heading>
        {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
          <button
            onClick={handleEdit}
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-small-regular"
            data-testid="edit-delivery-button"
          >
            Endre
          </button>
        )}
      </div>

      {isOpen ? (
        <>
          <div data-testid="delivery-options-container" className="pb-8">
            <RadioGroup
              value={shippingMethodId}
              onChange={(v) => v && handleSetShippingMethod(v)}
            >
              {allOptions.map((option) => {
                const isPickup = isPickupOption(option)
                const isDisabled =
                  !isPickup &&
                  option.price_type === "calculated" &&
                  !isLoadingPrices &&
                  typeof calculatedPricesMap[option.id] !== "number"

                const priceDisplay = isPickup ? (
                  convertToLocale({ amount: option.amount!, currency_code: cart.currency_code })
                ) : option.price_type === "flat" ? (
                  convertToLocale({ amount: option.amount!, currency_code: cart.currency_code })
                ) : calculatedPricesMap[option.id] ? (
                  convertToLocale({ amount: calculatedPricesMap[option.id], currency_code: cart.currency_code })
                ) : isLoadingPrices ? (
                  <Loader />
                ) : (
                  "-"
                )

                const storeAddress = isPickup
                  ? formatAddress((option as any).service_zone?.fulfillment_set?.location?.address)
                  : null

                return (
                  <Radio
                    key={option.id}
                    value={option.id}
                    disabled={isDisabled}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                      {
                        "border-ui-border-interactive": option.id === shippingMethodId,
                        "hover:shadow-none cursor-not-allowed": isDisabled,
                      }
                    )}
                  >
                    <div className="flex items-start gap-x-4">
                      <MedusaRadio checked={option.id === shippingMethodId} />
                      <div className="flex flex-col">
                        <span className="text-base-regular">{option.name}</span>
                        {storeAddress && (
                          <span className="text-sm text-ui-fg-muted">{storeAddress}</span>
                        )}
                      </div>
                    </div>
                    <span className="justify-self-end text-ui-fg-base">{priceDisplay}</span>
                  </Radio>
                )
              })}
            </RadioGroup>
          </div>

          <ErrorMessage error={error} data-testid="delivery-option-error-message" />
          <Button
            size="large"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!shippingMethodId}
            data-testid="submit-delivery-option-button"
          >
            Fortsett
          </Button>
        </>
      ) : (
        <div className="text-small-regular">
          {selectedMethod && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">Metode</Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {selectedMethod.name}{" "}
                {convertToLocale({
                  amount: selectedMethod.amount!,
                  currency_code: cart.currency_code,
                })}
              </Text>
            </div>
          )}
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
