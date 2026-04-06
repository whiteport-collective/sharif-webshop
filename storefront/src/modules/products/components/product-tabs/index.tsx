"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Dekkspesifikasjoner",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Montering og levering",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const meta = product.metadata as Record<string, string> | null

  const width = meta?.width
  const profile = meta?.profile
  const rim = meta?.rim
  const loadSpeed = meta?.load_speed
  const fuelRating = meta?.fuel_rating
  const gripRating = meta?.grip_rating
  const noiseDb = meta?.noise_db
  const dimension = width && profile && rim ? `${width}/${profile}R${rim}` : null

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {dimension && (
          <div>
            <span className="font-semibold">Størrelse</span>
            <p>{dimension}{loadSpeed ? ` ${loadSpeed}` : ""}</p>
          </div>
        )}
        {width && (
          <div>
            <span className="font-semibold">Bredde</span>
            <p>{width} mm</p>
          </div>
        )}
        {profile && (
          <div>
            <span className="font-semibold">Profil</span>
            <p>{profile}</p>
          </div>
        )}
        {rim && (
          <div>
            <span className="font-semibold">Felg</span>
            <p>R{rim}</p>
          </div>
        )}
      </div>

      {(fuelRating || gripRating || noiseDb) && (
        <div className="mt-6 pt-6 border-t border-ui-border-base">
          <span className="font-semibold text-base">EU-merking</span>
          <div className="grid grid-cols-3 gap-4 mt-3">
            {fuelRating && (
              <div className="text-center p-3 bg-ui-bg-subtle rounded-lg">
                <span className="text-xs text-ui-fg-muted block mb-1">Drivstoff</span>
                <span className="text-2xl font-bold">{fuelRating}</span>
              </div>
            )}
            {gripRating && (
              <div className="text-center p-3 bg-ui-bg-subtle rounded-lg">
                <span className="text-xs text-ui-fg-muted block mb-1">Veigrep</span>
                <span className="text-2xl font-bold">{gripRating}</span>
              </div>
            )}
            {noiseDb && (
              <div className="text-center p-3 bg-ui-bg-subtle rounded-lg">
                <span className="text-xs text-ui-fg-muted block mb-1">Støy</span>
                <span className="text-2xl font-bold">{noiseDb}</span>
                <span className="text-xs text-ui-fg-muted"> dB</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Montering inkludert</span>
            <p className="max-w-sm">
              Bestill time for montering hos Sharif Fjellhamar eller Drammen.
              Vi monterer dekkene mens du venter.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">60+ år med dekk</span>
            <p className="max-w-sm">
              Sharif har levert kvalitetsdekk til norske kunder i over 60 år.
              Vi kjenner nordiske forhold.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Kundeservice</span>
            <p className="max-w-sm">
              Spørsmål? Ring oss på +47 934 85 790 eller send en melding
              på WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
