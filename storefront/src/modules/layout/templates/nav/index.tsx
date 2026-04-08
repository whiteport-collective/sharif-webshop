import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

const NavLinks = [
  { label: "Dekk", href: "/store" },
  { label: "Merker", href: "/brands" },
  { label: "Om oss", href: "/" },
  { label: "Kontakt", href: "/" },
]

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">

          {/* Logo — always left */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="hover:opacity-70 transition-opacity"
              data-testid="nav-store-link"
            >
              <img src="/sharif-logo.png" alt="Sharif" className="h-8 w-auto" />
            </LocalizedClientLink>
          </div>

          {/* Desktop inline nav links */}
          <div className="hidden md:flex items-center gap-x-8 h-full">
            {NavLinks.map(({ label, href }) => (
              <LocalizedClientLink
                key={label}
                href={href}
                className="hover:text-ui-fg-base transition-colors text-sm font-medium"
              >
                {label}
              </LocalizedClientLink>
            ))}
          </div>

          {/* Right side: account + cart + hamburger */}
          <div className="flex items-center gap-x-4 h-full">
            <div className="hidden md:flex items-center gap-x-4 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base text-sm"
                href="/account"
                data-testid="nav-account-link"
              >
                Konto
              </LocalizedClientLink>
            </div>

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Handlekurv (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>

            {/* Hamburger — mobile only, hidden on md+ */}
            <div className="md:hidden h-full flex items-center">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

        </nav>
      </header>
    </div>
  )
}
