import { Suspense } from "react"
import { Metadata } from "next"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { getRegion } from "@lib/data/regions"
import FlowShell from "@modules/home/components/flow-shell"
import CartButton from "@modules/layout/components/cart-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Sharif | Kvalitetsdekk for nordiske forhold",
  description:
    "Finn dekk til din bil. Skriv inn dekkstørrelsen og finn de beste prisene.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  if (!region) return null

  const headers = { ...(await getAuthHeaders()) }
  const { products: allProducts } = await sdk.client.fetch<{
    products: { id: string; metadata: Record<string, string> | null }[]
    count: number
  }>("/store/products", {
    method: "GET",
    query: { limit: 500, fields: "id,metadata" },
    headers,
    next: { revalidate: 3600 },
  })
  const response = { products: allProducts }

  const dimensions = new Set<string>()
  const dimensionCounts: Record<string, number> = {}
  for (const product of response.products) {
    const meta = product.metadata as Record<string, string> | null
    if (meta?.width && meta?.profile && meta?.rim) {
      const key = `${meta.width}/${meta.profile}R${meta.rim}`
      dimensions.add(key)
      dimensionCounts[key] = (dimensionCounts[key] ?? 0) + 1
    }
  }

  const cartBadge = (
    <Suspense
      fallback={
        <LocalizedClientLink href="/cart" className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </LocalizedClientLink>
      }
    >
      <CartButton />
    </Suspense>
  )

  // Landing content — shown below the tire widget on the home panel
  const landingContent = (
    <div className="px-4 pb-16 pt-4 text-center text-ui-fg-muted">
      <p className="text-sm">60+ merker · Montering inkludert · Fra 499 kr</p>
    </div>
  )

  return (
    <FlowShell
      availableDimensions={Array.from(dimensions).sort()}
      dimensionCounts={dimensionCounts}
      countryCode={countryCode}
      region={region}
      cartBadge={cartBadge}
      landingContent={landingContent}
    />
  )
}
