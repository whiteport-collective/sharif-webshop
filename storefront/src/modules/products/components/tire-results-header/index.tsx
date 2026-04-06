"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Dialog, DialogPanel } from "@headlessui/react"

export type SortKey = "price" | "best" | "grip" | "fuel" | "noise" | "performance"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Laveste pris først" },
  { key: "best",  label: "Best vurdert" },
  { key: "grip",  label: "Beste veggrep" },
  { key: "fuel",  label: "Mest drivstofføkonomisk" },
  { key: "noise", label: "Stillest" },
]

export default function TireResultsHeader({
  count,
  activeSort,
  onSortChange,
}: {
  count: number
  activeSort: SortKey
  onSortChange?: (key: SortKey) => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function applySort(key: SortKey) {
    setDrawerOpen(false)
    setDropdownOpen(false)
    if (onSortChange) {
      onSortChange(key)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.set("sort", key)
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  const currentLabel = SORT_OPTIONS.find((o) => o.key === activeSort)?.label ?? "Laveste pris først"

  const sortButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-ui-fg-base bg-ui-fg-base text-ui-bg-base px-3 py-1.5 text-sm font-medium transition-colors"
    >
      {currentLabel}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-70">
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )

  return (
    <>
      {/* Results header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <p className="text-sm text-ui-fg-subtle">{count} dekk funnet</p>

        {/* Mobile: opens drawer */}
        <div className="md:hidden">
          {sortButton(() => setDrawerOpen(true))}
        </div>

        {/* Tablet+: opens dropdown */}
        <div className="relative hidden md:block" ref={dropdownRef}>
          {sortButton(() => setDropdownOpen((o) => !o))}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-ui-border-base bg-ui-bg-base shadow-lg overflow-hidden z-50">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => applySort(option.key)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                    option.key === activeSort
                      ? "bg-ui-bg-subtle font-semibold text-ui-fg-base"
                      : "text-ui-fg-base hover:bg-ui-bg-subtle"
                  }`}
                >
                  {option.label}
                  {option.key === activeSort && <span className="text-ui-fg-interactive">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sort drawer */}
      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} className="relative z-50 md:hidden">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end">
          <DialogPanel className="w-full rounded-t-2xl bg-ui-bg-base pt-5 shadow-xl" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom) + 1.5rem)" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
            <div className="mb-4 flex items-center justify-between px-6">
              <h3 className="text-lg font-bold text-ui-fg-base">Sorter</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} className="text-ui-fg-muted hover:text-ui-fg-base">✕</button>
            </div>
            <div className="flex flex-col pb-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => applySort(option.key)}
                  className={`flex items-center justify-between px-6 py-4 text-sm transition-colors ${
                    option.key === activeSort
                      ? "bg-ui-bg-subtle font-semibold text-ui-fg-base"
                      : "text-ui-fg-base hover:bg-ui-bg-subtle"
                  }`}
                >
                  {option.label}
                  {option.key === activeSort && <span className="text-ui-fg-interactive">✓</span>}
                </button>
              ))}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
