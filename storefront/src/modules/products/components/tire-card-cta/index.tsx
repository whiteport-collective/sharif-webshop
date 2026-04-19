"use client"

import { useState, useRef } from "react"
import { Dialog, DialogPanel } from "@headlessui/react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/i18n"

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function TireCardCta({
  handle,
  initialQty,
  isAvailable,
  isInCart = false,
  onSelect,
  onRemove,
}: {
  handle: string
  initialQty: number
  isAvailable: boolean
  isInCart?: boolean
  onSelect?: (qty: number) => void
  onRemove?: () => void
}) {
  const { t } = useLanguage()
  const [qty, setQty] = useState(initialQty)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const selectingRef = useRef(false)

  const options = [1, 2, 3, 4, 5, 6, 7, 8]

  // ── In-cart state ──────────────────────────────────────────────
  if (isInCart) {
    return (
      <div className="mx-4 mb-4 flex items-stretch overflow-hidden rounded-lg text-sm font-semibold">
        {/* Confirmation — re-opens delivery & mounting */}
        <button
          type="button"
          onClick={() => onSelect?.(qty)}
          aria-label={t.proceedToCheckout}
          className="flex flex-1 items-center justify-center bg-green-600 px-4 py-3 text-white hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          {t.proceedToCheckout}
        </button>

        {/* Divider */}
        <span className="w-px self-stretch bg-white/30" />

        {/* Remove from cart */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.remove}
          className="flex items-center justify-center bg-green-800 px-4 py-3 text-white hover:bg-green-900 active:bg-green-950 transition-colors"
        >
          <TrashIcon />
        </button>
      </div>
    )
  }

  // ── Idle state ─────────────────────────────────────────────────
  return (
    <>
      <div
        className={`mx-4 mb-4 flex items-stretch overflow-hidden rounded-lg text-sm font-semibold transition-colors duration-200 ${
          !isAvailable
            ? "pointer-events-none bg-ui-bg-subtle text-ui-fg-muted"
            : selecting
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
        }`}
      >
        {/* Quantity — opens drawer */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            if (isAvailable) setDrawerOpen(true)
          }}
          className="flex items-center justify-center gap-1 px-4 py-3 text-base font-bold hover:bg-black/10 active:bg-black/20"
        >
          {qty} <span className="text-sm font-medium opacity-80">st</span>
        </button>

        {/* Divider */}
        <span className="w-px self-stretch bg-white/30" />

        {/* "Velg disse" — enters flow or navigates to product */}
        {onSelect ? (
          <button
            type="button"
            onClick={() => {
              if (!isAvailable || selectingRef.current) return
              selectingRef.current = true
              setSelecting(true)
              setTimeout(() => {
                onSelect(qty)
                // reset after a bit in case user comes back without unmounting
                setTimeout(() => { setSelecting(false); selectingRef.current = false }, 800)
              }, 400)
            }}
            className="flex flex-1 items-center justify-center py-3 hover:bg-black/10"
          >
            {selecting ? "✓" : t.addToCart}
          </button>
        ) : (
          <LocalizedClientLink
            href={isAvailable ? `/products/${handle}?qty=${qty}` : "#"}
            className="flex flex-1 items-center justify-center py-3 hover:bg-black/10"
          >
            {t.addToCart}
          </LocalizedClientLink>
        )}
      </div>

      {/* Qty drawer */}
      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end">
          <DialogPanel className="w-full rounded-t-2xl bg-ui-bg-base pb-8 pt-5 shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
            <p className="mb-4 px-6 text-sm font-medium text-ui-fg-muted">
              Antall dekk
            </p>
            <div className="grid grid-cols-4 gap-3 px-6">
              {options.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setQty(n)
                    setDrawerOpen(false)
                  }}
                  className={`rounded-xl border py-4 text-lg font-bold transition-colors ${
                    n === qty
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-ui-border-base bg-ui-bg-base text-ui-fg-base hover:bg-ui-bg-subtle"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
