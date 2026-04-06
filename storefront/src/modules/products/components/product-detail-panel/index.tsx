"use client"

import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"
import { useEffect } from "react"

type TireMeta = {
  width?: string
  profile?: string
  rim?: string
  load_speed?: string
  fuel_rating?: string
  grip_rating?: string
  noise_db?: string | number
  season?: string
}

function gradeToPercent(grade: string): number {
  return { A: 100, B: 82, C: 64, D: 46, E: 28, F: 18, G: 10 }[grade] ?? 0
}

function EuRow({ label, value, percent, colorClass }: {
  label: string
  value: string
  percent: number
  colorClass: string
}) {
  return (
    <div className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3">
      <span className="text-xs uppercase tracking-wide text-ui-fg-muted">{label}</span>
      <div className="relative h-2 w-full rounded-full bg-gray-200">
        <div className={`absolute left-0 top-0 h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-right text-sm font-bold">{value}</span>
    </div>
  )
}

export default function ProductDetailPanel({
  product,
  region,
  qty,
  onClose,
  onSelect,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  qty: number
  onClose: () => void
  onSelect: (product: HttpTypes.StoreProduct, qty: number) => void
}) {
  const meta = (product.metadata ?? {}) as TireMeta
  const variant = product.variants?.[0] as any
  const calculatedAmount = variant?.calculated_price?.calculated_amount

  const priceFormatted = calculatedAmount != null
    ? new Intl.NumberFormat("nb-NO", {
        style: "currency",
        currency: variant?.calculated_price?.currency_code ?? region.currency_code ?? "NOK",
        maximumFractionDigits: 0,
      }).format(calculatedAmount)
    : null

  const dimension = meta.width && meta.profile && meta.rim
    ? `${meta.width}/${meta.profile}R${meta.rim}${meta.load_speed ? ` ${meta.load_speed}` : ""}`
    : null

  const [brand, ...modelParts] = product.title?.split(" ") ?? []
  const fullModel = modelParts.join(" ")
  const model = meta.width && meta.profile && meta.rim
    ? fullModel.replace(/\s+\d+\/\d+[A-Z]*R\d+\S*$/, "").trim()
    : fullModel

  const fuelGrade = meta.fuel_rating ?? null
  const gripGrade = meta.grip_rating ?? null
  const noiseDb = meta.noise_db ? Number(meta.noise_db) : null

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom drawer on mobile, centered modal on md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.title ?? "Produktdetaljer"}
        className={[
          "fixed z-50 bg-white overflow-y-auto",
          // Mobile: full-width drawer from bottom, max 90vh
          "inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl",
          // Desktop: centered modal
          "md:inset-0 md:m-auto md:rounded-2xl md:max-h-[85vh] md:max-w-2xl md:shadow-2xl",
        ].join(" ")}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-ui-bg-subtle text-ui-fg-muted hover:bg-ui-bg-base"
          aria-label="Lukk"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="w-full md:w-80 md:shrink-0">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="square"
              className="!rounded-none md:!rounded-tl-2xl"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-5 px-5 py-5">
            {/* Title */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ui-fg-muted">{brand}</p>
              <h2 className="mt-0.5 text-xl font-bold leading-snug text-ui-fg-base">{model}</h2>
              {dimension && (
                <p className="mt-1 text-sm text-ui-fg-subtle">{dimension}</p>
              )}
            </div>

            {/* Price */}
            {priceFormatted && (
              <p className="text-2xl font-bold text-ui-fg-base">
                {priceFormatted}{" "}
                <span className="text-sm font-normal text-ui-fg-muted">per dekk</span>
              </p>
            )}

            {/* EU labels */}
            {(fuelGrade || gripGrade || noiseDb) && (
              <div className="flex flex-col gap-2 rounded-xl bg-ui-bg-subtle px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ui-fg-muted mb-1">EU-merking</p>
                {fuelGrade && (
                  <EuRow label="Drivstoff" value={fuelGrade} percent={gradeToPercent(fuelGrade)} colorClass="bg-emerald-500" />
                )}
                {gripGrade && (
                  <EuRow label="Veigrep" value={gripGrade} percent={gradeToPercent(gripGrade)} colorClass="bg-amber-500" />
                )}
                {noiseDb && (
                  <EuRow
                    label="Støy"
                    value={`${noiseDb} dB`}
                    percent={Math.max(18, Math.min(100, 100 - (noiseDb - 66) * 11))}
                    colorClass="bg-sky-500"
                  />
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div
                className="prose prose-sm max-w-none text-ui-fg-subtle"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {/* CTA */}
            <div className="mt-auto pb-6 pt-2">
              <button
                type="button"
                onClick={() => { onClose(); onSelect(product, qty) }}
                className="w-full rounded-xl bg-red-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-red-700"
              >
                Velg disse — {priceFormatted ?? ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
