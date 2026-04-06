import CheckoutPanel from "@modules/checkout/components/checkout-panel"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CheckoutPanel>
      <div className="h-16 border-b border-ui-border-base sticky top-0 bg-white z-10">
        <nav className="flex h-full items-center justify-between px-4">
          <LocalizedClientLink
            href="/"
            className="text-sm font-medium text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex-1"
          >
            ← Tilbake
          </LocalizedClientLink>
          <img src="/sharif-logo.png" alt="Sharif" className="h-8 w-auto" />
          <div className="flex-1" />
        </nav>
      </div>
      <div>{children}</div>
    </CheckoutPanel>
  )
}
