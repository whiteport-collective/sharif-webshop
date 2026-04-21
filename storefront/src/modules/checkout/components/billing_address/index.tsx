import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import React, { useEffect, useMemo, useState } from "react"
import CountrySelect from "../country-select"

export type BillingAddressSnapshot = {
  filledFields: string[]
  requiredMissingFields: string[]
  isComplete: boolean
}

const BillingAddress = ({
  cart,
  onSnapshotChange,
}: {
  cart: HttpTypes.StoreCart | null
  onSnapshotChange?: (snapshot: BillingAddressSnapshot) => void
}) => {
  const [formData, setFormData] = useState<any>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const snapshot = useMemo<BillingAddressSnapshot>(() => {
    const visibleFields = [
      "billing_address.first_name",
      "billing_address.last_name",
      "billing_address.address_1",
      "billing_address.company",
      "billing_address.postal_code",
      "billing_address.city",
      "billing_address.country_code",
      "billing_address.province",
      "billing_address.phone",
    ]
    const requiredFields = [
      "billing_address.first_name",
      "billing_address.last_name",
      "billing_address.address_1",
      "billing_address.postal_code",
      "billing_address.country_code",
    ]
    const filledFields = visibleFields.filter((field) => String(formData[field] ?? "").trim())
    const requiredMissingFields = requiredFields.filter((field) => !String(formData[field] ?? "").trim())

    return {
      filledFields,
      requiredMissingFields,
      isComplete: requiredMissingFields.length === 0,
    }
  }, [formData])

  useEffect(() => {
    onSnapshotChange?.(snapshot)
  }, [onSnapshotChange, snapshot])

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label="Address"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label="Company"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <Input
          label="City"
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"]}
          onChange={handleChange}
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["billing_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="billing-country-select"
        />
        <Input
          label="State / Province"
          name="billing_address.province"
          autoComplete="address-level1"
          value={formData["billing_address.province"]}
          onChange={handleChange}
          data-testid="billing-province-input"
        />
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress
