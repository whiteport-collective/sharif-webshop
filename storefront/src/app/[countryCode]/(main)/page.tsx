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
    <div className="pb-16">
      {/* Tagline */}
      <p className="px-4 pt-4 pb-12 text-center text-sm text-ui-fg-muted">
        60+ merker · Montering inkludert · Fra 499 kr
      </p>

      {/* Value propositions */}
      <div className="mx-auto max-w-4xl px-6 grid grid-cols-1 md:grid-cols-3 gap-8 pb-16">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-ui-fg-base mb-1">Kvalitetsdekk</h3>
          <p className="text-sm text-ui-fg-subtle">Fra ledende merker som Bridgestone, Nokian og Continental. Alle dekk med EU-merking.</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.71-3.12a.78.78 0 010-1.36l5.71-3.12a2.18 2.18 0 012.16 0l5.71 3.12a.78.78 0 010 1.36l-5.71 3.12a2.18 2.18 0 01-2.16 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.71 12.05l5.71 3.12a2.18 2.18 0 002.16 0l5.71-3.12" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-ui-fg-base mb-1">Montering inkludert</h3>
          <p className="text-sm text-ui-fg-subtle">Bestill tid hos verksted i Drammen eller Fjellhamar. Montering er alltid inkludert i prisen.</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5M3.375 14.25h4.5" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-ui-fg-base mb-1">Rask levering</h3>
          <p className="text-sm text-ui-fg-subtle">Hjemlevering eller hent hos verksted. De fleste bestillinger klare innen 2-3 virkedager.</p>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-t border-ui-border-base py-10">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-ui-fg-muted mb-6">Merker vi forer</p>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
          {["Bridgestone", "Nokian", "Continental", "Michelin", "Powertrac", "Hankook"].map((brand) => (
            <span key={brand} className="text-sm font-medium text-ui-fg-subtle">{brand}</span>
          ))}
        </div>
      </div>

      {/* Workshop locations */}
      <div className="border-t border-ui-border-base py-12 px-6">
        <div className="mx-auto max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-ui-border-base p-6">
            <h4 className="text-sm font-semibold text-ui-fg-base mb-1">Drammen</h4>
            <p className="text-sm text-ui-fg-subtle">Tordenskiolds gate 73, 3044 Drammen</p>
            <p className="text-xs text-ui-fg-muted mt-2">Man-Fre 08:00-16:00</p>
          </div>
          <div className="rounded-xl border border-ui-border-base p-6">
            <h4 className="text-sm font-semibold text-ui-fg-base mb-1">Fjellhamar</h4>
            <p className="text-sm text-ui-fg-subtle">Industriveien 12, 1472 Fjellhamar</p>
            <p className="text-xs text-ui-fg-muted mt-2">Man-Fre 08:00-16:00</p>
          </div>
        </div>
      </div>
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
