"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SORT_OPTIONS } from "@modules/products/lib/tire-sorting"
import type { HeaderProps } from "./types"

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
  cartBadge,
  chatOpen,
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
              className="min-w-0 truncate text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base"
              title={`${chipDimension}${chipSeasonLabel ? ` · ${chipSeasonLabel}` : ""}${qty ? ` · ${qty} stk` : ""}`}
            >
              <span>{chipDimension}</span>
              {chipSeasonLabel ? <span> · {chipSeasonLabel}</span> : null}
              {qty ? <span> · {qty} stk</span> : null}
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

      <div className="flex flex-none items-center gap-1">
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

        <button
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-ui-bg-subtle ${
            chatOpen ? "border-ui-fg-base bg-ui-bg-subtle text-ui-fg-base" : "border-ui-border-base text-ui-fg-base"
          }`}
          aria-label="Chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

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

        {cartBadge}
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
