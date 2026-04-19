"use client"

import { useEffect, useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { SORT_OPTIONS } from "@modules/products/lib/tire-sorting"
import type { HeaderProps } from "./types"

function formatNOK(amount: number | undefined | null) {
  if (amount == null) return ""
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(amount)
}

function MiniCart({
  cart,
  cartQty,
  checkoutLocked,
  onRemoveLine,
}: {
  cart: HeaderProps["cart"]
  cartQty: number
  checkoutLocked: boolean
  onRemoveLine: (lineItemId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const items = cart?.items ?? []
  const subtotal = cart?.subtotal ?? 0

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Handlekurv"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        {cartQty > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {cartQty}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-xl border border-ui-border-base bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
            <h3 className="text-sm font-semibold text-ui-fg-base">Handlekurv</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Lukk handlekurv"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ui-fg-muted hover:bg-ui-bg-subtle hover:text-ui-fg-base transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-ui-fg-muted">
              Handlekurven er tom
            </div>
          ) : (
            <>
              <div className="max-h-[320px] overflow-y-auto">
                {items
                  .slice()
                  .sort((a: any, b: any) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                  .map((item: any) => (
                    <div key={item.id} className="flex gap-3 border-b border-ui-border-base px-4 py-3 last:border-b-0">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-ui-bg-subtle">
                        <Thumbnail
                          thumbnail={item.thumbnail}
                          images={item.variant?.product?.images}
                          size="square"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between text-xs">
                        <div>
                          <p className="font-medium text-ui-fg-base line-clamp-2 leading-tight">
                            {item.product_title ?? item.title}
                          </p>
                          <p className="mt-0.5 text-ui-fg-muted">
                            {item.quantity} stk · {formatNOK(item.unit_price)}
                          </p>
                        </div>
                        <div className="flex items-end justify-between">
                          <button
                            type="button"
                            onClick={() => onRemoveLine(item.id)}
                            className="text-xs text-ui-fg-muted underline hover:text-red-600 transition-colors disabled:no-underline disabled:opacity-50"
                            disabled={checkoutLocked}
                          >
                            {checkoutLocked ? "Låst" : "Fjern"}
                          </button>
                          <p className="text-sm font-semibold text-ui-fg-base">
                            {formatNOK(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-between border-t border-ui-border-base px-4 py-3">
                <span className="text-sm text-ui-fg-muted">Totalt</span>
                <span className="text-sm font-semibold text-ui-fg-base">
                  {formatNOK(subtotal)}
                </span>
              </div>
              <div className="px-4 pb-4">
                {checkoutLocked ? (
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-2.5 text-center text-xs text-ui-fg-muted">
                    Checkout is locked after confirmation. Use chat for changes.
                  </div>
                ) : (
                  <LocalizedClientLink
                    href="/cart"
                    className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Til kassen
                  </LocalizedClientLink>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MenuIcon({ activeSection }: { activeSection: HeaderProps["activeSection"] }) {
  return (
    <div className="relative flex h-4 w-4 items-center justify-center">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="absolute"
        style={{ opacity: activeSection === "home" ? 1 : 0, transition: "opacity 300ms ease-in-out" }}
      >
        <rect x="0" y="3" width="16" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="0" y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="0" y="11.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="absolute"
        style={{ opacity: activeSection === "home" ? 0 : 1, transition: "opacity 300ms ease-in-out" }}
      >
        <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function FlowShellHeader({
  activeSection,
  activeSort,
  cart,
  cartBadge,
  cartQty,
  chatOpen,
  checkoutLocked,
  checkoutStepTitle,
  chipDimension,
  chipSeasonLabel,
  displayCount,
  handleHeaderBack,
  hasSearch,
  headerSortOpen,
  hideBack,
  lang,
  langMenuOpen,
  langMenuRef,
  menuOpen,
  onClearSearch,
  onRemoveLine,
  onScrollHome,
  onSelectLanguage,
  onSortChange,
  setChatOpen,
  setHeaderSortOpen,
  setLangMenuOpen,
  setMenuOpen,
  sortMenuRef,
  qty,
}: HeaderProps) {
  return (
    <header className="z-[90] flex h-14 flex-none items-center border-b border-ui-border-base bg-white px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {hideBack ? (
          <div className="w-9 flex-none" />
        ) : (
          <button
            type="button"
            onClick={activeSection === "home" ? () => setMenuOpen((open) => !open) : handleHeaderBack}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full border"
            style={{
              backgroundColor: menuOpen && activeSection === "home" ? "#dc2626" : undefined,
              borderColor: menuOpen && activeSection === "home" ? "#dc2626" : undefined,
              color: menuOpen && activeSection === "home" ? "white" : undefined,
              transition: "background-color 300ms ease-in-out, border-color 300ms ease-in-out, color 300ms ease-in-out",
            }}
            aria-label={activeSection === "home" ? "Meny" : "Tilbake"}
          >
            <MenuIcon activeSection={activeSection} />
          </button>
        )}

        <img src="/sharif-logo.png" alt="Sharif" className={`w-auto flex-none ${hasSearch ? "h-5 sm:h-7" : "h-7"}`} />

        {hasSearch && (
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={onScrollHome}
              className="flex min-w-0 items-center gap-1 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base"
              title={`${chipDimension}${chipSeasonLabel ? ` · ${chipSeasonLabel}` : ""}${qty ? ` · ${qty} stk` : ""}`}
            >
              <span className="truncate">{chipDimension}</span>
              {(chipSeasonLabel || qty) && (
                <span className="shrink-0 rounded-full bg-ui-bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ui-fg-base">
                  {chipSeasonLabel}
                  {chipSeasonLabel && qty ? " · " : ""}
                  {qty ? `${qty} stk` : ""}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onClearSearch}
              className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-ui-fg-muted hover:text-ui-fg-base"
              aria-label="Fjern søk"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {checkoutStepTitle && (
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center">
          <span className="text-sm font-semibold text-ui-fg-base">{checkoutStepTitle}</span>
        </div>
      )}

      <div className="flex flex-none items-center gap-2.5">
        <div
          ref={sortMenuRef}
          className="relative mr-1 flex items-center gap-2 transition-all duration-300"
          style={{
            opacity: activeSection === "results" ? 1 : 0,
            pointerEvents: activeSection === "results" ? "auto" : "none",
            transform: activeSection === "results" ? "translateY(0)" : "translateY(-4px)",
          }}
        >
          <span className="hidden whitespace-nowrap text-xs text-ui-fg-subtle sm:block">{displayCount} dekk</span>

          <button
            type="button"
            onClick={() => setHeaderSortOpen((open) => !open)}
            className="flex items-center gap-1 rounded-full bg-[#212529] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#343a40]"
          >
            {SORT_OPTIONS.find((option) => option.key === activeSort)?.label ?? "Sorter"}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {headerSortOpen && (
            <div className="absolute right-0 top-full z-[70] mt-1 w-52 overflow-hidden rounded-xl border border-ui-border-base bg-white shadow-lg">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onSortChange(option.key)
                    setHeaderSortOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                    option.key === activeSort ? "bg-ui-bg-subtle font-semibold" : "hover:bg-ui-bg-subtle"
                  }`}
                >
                  {option.label}
                  {option.key === activeSort && <span className="text-ui-fg-interactive">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {cartQty !== null ? (
          <MiniCart
            cart={cart}
            cartQty={cartQty}
            checkoutLocked={checkoutLocked}
            onRemoveLine={onRemoveLine}
          />
        ) : (
          cartBadge
        )}

        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen((open) => !open)}
            className="flex h-9 min-w-9 items-center justify-center rounded-full border border-ui-border-base px-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-ui-bg-subtle"
            aria-label="Velg språk"
          >
            {lang}
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full z-[70] mt-1 w-32 overflow-hidden rounded-xl border border-ui-border-base bg-white shadow-lg">
              {[
                { key: "no" as const, label: "Norsk" },
                { key: "en" as const, label: "English" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectLanguage(option.key)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-ui-bg-subtle ${
                    lang === option.key ? "font-semibold" : ""
                  }`}
                >
                  <span className="w-6 text-xs font-semibold uppercase">{option.key}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full border"
          style={{
            backgroundColor: chatOpen ? "#dc2626" : undefined,
            borderColor: chatOpen ? "#dc2626" : undefined,
            color: chatOpen ? "white" : undefined,
            transition: "background-color 300ms ease-in-out, border-color 300ms ease-in-out, color 300ms ease-in-out",
          }}
          aria-label="Chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export function FlowShellMenu({ menuOpen, onClose }: { menuOpen: boolean; onClose: () => void }) {
  return (
    <>
      <aside
        className="z-[91] hidden flex-none flex-col overflow-hidden border-r bg-white lg:flex"
        style={{
          borderColor: menuOpen ? undefined : "transparent",
          transition: "width 300ms ease-in-out, border-color 300ms ease-in-out",
          width: menuOpen ? "15rem" : "0px",
        }}
      >
        <div className="flex h-14 flex-none items-center border-b border-ui-border-base px-4">
          <span className="text-sm font-semibold text-ui-fg-base">Meny</span>
        </div>

        <nav className="flex-1 overflow-y-auto whitespace-nowrap p-4">
          <ul className="flex flex-col gap-4">
            <li><LocalizedClientLink href="/" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Home</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/store" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Store</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/brands" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Brands</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/account" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Account</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/cart" className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-subtle">Cart</LocalizedClientLink></li>
          </ul>
        </nav>
      </aside>

      {menuOpen && (
        <div className="absolute inset-x-0 top-14 z-50 flex items-center justify-between border-b border-ui-border-base bg-white p-4 shadow-md lg:hidden">
          <a href="tel:+4793485790" className="text-sm font-medium text-ui-fg-base hover:underline">
            Ring oss
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ui-fg-base hover:bg-ui-bg-subtle"
            aria-label="Lukk meny"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
