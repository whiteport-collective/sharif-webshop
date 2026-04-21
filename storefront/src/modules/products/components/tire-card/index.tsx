"use client"

import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"
import TireCardCta from "@modules/products/components/tire-card-cta"
import { convertToLocale } from "@lib/util/money"
import { useLanguage } from "@lib/i18n"

type TireMeta = {
  width?: string
  profile?: string
  rim?: string
  load_speed?: string
  fuel_rating?: string
  grip_rating?: string
  noise_db?: string | number
}

function gradeToPercent(grade: string): number {
  return { A: 100, B: 82, C: 64, D: 46, E: 28, F: 18, G: 10 }[grade] ?? 0
}

function isValidGrade(value: string | undefined): value is string {
  return Boolean(value && ["A", "B", "C", "D", "E", "F", "G"].includes(value))
}

function EuBar({
  label,
  value,
  percent,
  colorClass,
  empty,
}: {
  label: string
  value: string
  percent: number
  colorClass: string
  empty?: boolean
}) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2">
      <span className={`text-[10px] uppercase tracking-wide ${empty ? "text-ui-fg-disabled" : "text-ui-fg-muted"}`}>
        {label}
      </span>
      <div className="relative h-1.5 w-full rounded-full bg-gray-300">
        {!empty && (
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${colorClass}`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <span className={`text-right text-xs font-bold ${empty ? "text-ui-fg-disabled" : ""}`}>{value}</span>
    </div>
  )
}

function StockBadge({
  status,
  qty,
}: {
  status: "in-stock" | "low-stock" | "out-of-stock" | "unknown"
  qty?: number
}) {
  const { t } = useLanguage()
  if (status === "out-of-stock") {
    return (
      <span className="inline-flex items-center rounded-full bg-ui-bg-subtle px-3 py-1 text-xs text-ui-fg-muted">
        {t.outOfStock}
      </span>
    )
  }
  if (status === "low-stock") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
        {t.lowStock} ({qty})
      </span>
    )
  }
  if (status === "in-stock") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        {t.inStock}
      </span>
    )
  }
  return null
}

export default function TireCard({
  product,
  region,
  qty = 4,
  isInCart = false,
  isHighlighted = false,
  onSelectTire,
  onRemoveTire,
  onProductDetail,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  qty?: number
  isInCart?: boolean
  isHighlighted?: boolean
  onSelectTire?: (product: HttpTypes.StoreProduct, qty: number) => void
  onRemoveTire?: () => void
  onProductDetail?: (product: HttpTypes.StoreProduct) => void
}) {
  const { t } = useLanguage()
  const meta = (product.metadata ?? {}) as TireMeta

  const dimension =
    meta.width && meta.profile && meta.rim
      ? `${meta.width}/${meta.profile}R${meta.rim}${meta.load_speed ? ` ${meta.load_speed}` : ""}`
      : null

  const variant = product.variants?.[0] as any
  const calculatedAmount = variant?.calculated_price?.calculated_amount
  const inventoryQty = variant?.inventory_quantity as number | undefined

  const priceFormatted =
    calculatedAmount != null
      ? new Intl.NumberFormat("nb-NO", {
          style: "currency",
          currency:
            variant?.calculated_price?.currency_code ??
            region.currency_code ??
            "NOK",
          maximumFractionDigits: 0,
        }).format(calculatedAmount)
      : null

  const stockStatus =
    inventoryQty == null
      ? "unknown"
      : inventoryQty > 10
        ? "in-stock"
        : inventoryQty > 0
          ? "low-stock"
          : "out-of-stock"

  const fuelGrade = isValidGrade(meta.fuel_rating) ? meta.fuel_rating : null
  const gripGrade = isValidGrade(meta.grip_rating) ? meta.grip_rating : null
  const noiseDb = meta.noise_db ? Number(meta.noise_db) : null

  const [brand, ...modelParts] = product.title?.split(" ") ?? []
  // Strip dimension from end of model name — seeded titles include "205/55R16"
  // which duplicates the dimension line shown below the title.
  const fullModel = modelParts.join(" ")
  // Strip trailing dimension token (e.g. "205/55R16", "205/55ZR16") from
  // model name — seeded titles include the dimension which duplicates the
  // dimension line rendered below the heading.
  const model = meta.width && meta.profile && meta.rim
    ? fullModel.replace(/\s+\d+\/\d+[A-Z]*R\d+\S*$/, "").trim()
    : fullModel

  // Only hard-disable the button when inventory is explicitly 0.
  // "unknown" (API didn't return the field) is treated as available — Medusa v2
  // doesn't reliably expose inventory_quantity without full location wiring.
  const isAvailable = stockStatus !== "out-of-stock" || inventoryQty == null

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-ui-bg-base shadow-sm transition-shadow hover:shadow-md ${
        isHighlighted
          ? "border-amber-400 ring-2 ring-amber-400 ring-offset-1"
          : "border-ui-border-base"
      }`}
    >
      <button
        type="button"
        onClick={() => onProductDetail ? onProductDetail(product) : undefined}
        className="flex flex-1 flex-col gap-4 text-left"
      >
        {/* Image — flush to card edges, no inner border */}
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="square"
          className="!rounded-none !shadow-none"
        />

        {/* Brand + Model — fixed height for 2-line titles + dimension */}
        <div className="flex min-h-[5.5rem] flex-col gap-0.5 px-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ui-fg-muted">
            {brand}
          </p>
          <h3 className="line-clamp-2 font-semibold leading-snug text-ui-fg-base">
            {model}
          </h3>
          {dimension && (
            <p className="mt-1 text-xs text-ui-fg-subtle">{dimension}</p>
          )}
        </div>

        {/* EU labels — always 3 rows so all cards align */}
        <div className="flex flex-col gap-1.5 px-4">
          <EuBar
            label={t.fuel}
            value={fuelGrade ?? "–"}
            percent={fuelGrade ? gradeToPercent(fuelGrade) : 0}
            colorClass="bg-emerald-500"
            empty={!fuelGrade}
          />
          <EuBar
            label={t.grip}
            value={gripGrade ?? "–"}
            percent={gripGrade ? gradeToPercent(gripGrade) : 0}
            colorClass="bg-amber-500"
            empty={!gripGrade}
          />
          <EuBar
            label={t.noise}
            value={noiseDb ? `${noiseDb} dB` : "–"}
            percent={noiseDb ? Math.max(18, Math.min(100, 100 - (noiseDb - 66) * 11)) : 0}
            colorClass="bg-sky-500"
            empty={!noiseDb}
          />
        </div>

        {/* Price + Stock */}
        <div className="mt-auto flex flex-col items-start gap-2 px-4 pb-3">
          {priceFormatted ? (
            <p className="text-xl font-bold text-ui-fg-base">
              {priceFormatted}{" "}
              <span className="text-sm font-normal text-ui-fg-muted">{t.perTire}</span>
            </p>
          ) : (
            <p className="text-sm text-ui-fg-muted">{t.priceUnavailable}</p>
          )}
          <StockBadge status={stockStatus} qty={inventoryQty} />
        </div>

      </button>

      <TireCardCta
        handle={product.handle ?? ""}
        initialQty={qty}
        isAvailable={isAvailable}
        isInCart={isInCart}
        onSelect={onSelectTire ? (n) => onSelectTire(product, n) : undefined}
        onRemove={onRemoveTire}
      />
    </div>
  )
}
