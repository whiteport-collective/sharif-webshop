import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

export type ShippingAddressSnapshot = {
  filledFields: string[]
  requiredMissingFields: string[]
  isComplete: boolean
}

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  isWorkshop = false,
  onSnapshotChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  isWorkshop?: boolean
  onSnapshotChange?: (snapshot: ShippingAddressSnapshot) => void
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || (isWorkshop ? "no" : ""),
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
    car_registration: (cart?.metadata?.car_registration as string) || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }
    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart])

  // For workshop orders, keep country_code as "no" so setAddresses redirect works
  useEffect(() => {
    if (isWorkshop) {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.country_code": prev["shipping_address.country_code"] || "no",
      }))
    }
  }, [isWorkshop])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const snapshot = useMemo<ShippingAddressSnapshot>(() => {
    const visibleFields = [
      "shipping_address.first_name",
      "shipping_address.last_name",
      "email",
      "shipping_address.phone",
      "car_registration",
      ...(!isWorkshop
        ? [
            "shipping_address.address_1",
            "shipping_address.company",
            "shipping_address.postal_code",
            "shipping_address.city",
            "shipping_address.country_code",
            "shipping_address.province",
          ]
        : []),
    ]
    const requiredFields = [
      "shipping_address.first_name",
      "shipping_address.last_name",
      "email",
      "car_registration",
      ...(!isWorkshop
        ? [
            "shipping_address.address_1",
            "shipping_address.postal_code",
            "shipping_address.city",
            "shipping_address.country_code",
          ]
        : []),
    ]
    const filledFields = visibleFields.filter((field) => String(formData[field] ?? "").trim())
    const requiredMissingFields = requiredFields.filter((field) => !String(formData[field] ?? "").trim())

    return {
      filledFields,
      requiredMissingFields,
      isComplete: requiredMissingFields.length === 0,
    }
  }, [formData, isWorkshop])

  useEffect(() => {
    onSnapshotChange?.(snapshot)
  }, [onSnapshotChange, snapshot])

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && !isWorkshop && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hei ${customer.first_name}, vil du bruke en lagret adresse?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}

      {/* Name — always shown */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fornavn"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Etternavn"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
      </div>

      {/* Full address — only for home delivery */}
      {!isWorkshop && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Input
            label="Adresse"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="shipping-address-input"
          />
          <Input
            label="Bedrift"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            data-testid="shipping-company-input"
          />
          <Input
            label="Postnummer"
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-postal-code-input"
          />
          <Input
            label="By"
            name="shipping_address.city"
            autoComplete="address-level2"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            data-testid="shipping-city-input"
          />
          <CountrySelect
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-country-select"
          />
          <Input
            label="Fylke"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            data-testid="shipping-province-input"
          />
        </div>
      )}

      {/* Hidden country for workshop so setAddresses redirect works */}
      {isWorkshop && (
        <input
          type="hidden"
          name="shipping_address.country_code"
          value={formData["shipping_address.country_code"] || "no"}
        />
      )}

      {/* Billing same as shipping — only for home delivery */}
      {!isWorkshop && (
        <div className="my-8">
          <Checkbox
            label="Fakturaadresse er samme som leveringsadresse"
            name="same_as_billing"
            checked={checked}
            onChange={onChange}
            data-testid="billing-address-checkbox"
          />
        </div>
      )}

      {/* For workshop, always same as billing */}
      {isWorkshop && (
        <input type="hidden" name="same_as_billing" value="on" />
      )}

      {/* Email + Phone — always shown */}
      <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
        <Input
          label="E-post"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Telefon"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>

      {/* Car registration — always shown */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Bilregistreringsnummer"
          name="car_registration"
          autoComplete="off"
          value={formData.car_registration}
          onChange={handleChange}
          required
          data-testid="car-registration-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
