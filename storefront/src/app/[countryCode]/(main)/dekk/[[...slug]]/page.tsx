import { Suspense } from "react"
import { Metadata } from "next"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { getRegion } from "@lib/data/regions"
import FlowShell from "@modules/home/components/flow-shell"
import CartButton from "@modules/layout/components/cart-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * /dekk/:dimension/:season/:qty
 * e.g. /dekk/205-55R16/sommer/4
 */

function parseSlug(slug: string[]): {
  width: string
  profile: string
  rim: string
  season: string
  qty: number
} | null {
  if (!slug || slug.length < 1) return null

  const dimMatch = slug[0].match(/^(\d+)-(\d+)R(\d+)$/i)
  if (!dimMatch) return null

  return {
    width: dimMatch[1],
    profile: dimMatch[2],
    rim: dimMatch[3],
    season: slug[1] || "sommer",
    qty: Number(slug[2]) || 4,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) {
    return { title: "Sharif | Dekk" }
  }

  const seasonNames: Record<string, string> = {
    sommer: "Sommerdekk",
    "vinter-piggfritt": "Vinterdekk piggfritt",
    "vinter-piggdekk": "Vinterdekk piggdekk",
  }
  const seasonLabel = seasonNames[parsed.season] || parsed.season
  const dim = `${parsed.width}/${parsed.profile}R${parsed.rim}`

  return {
    title: `${dim} ${seasonLabel} | Sharif`,
    description: `Finn ${seasonLabel.toLowerCase()} i ${dim}. ${parsed.qty} stk. Montering inkludert.`,
  }
}

export default async function DekkPage({
  params,
}: {
  params: Promise<{ countryCode: string; slug?: string[] }>
}) {
  const { countryCode, slug } = await params
  const region = await getRegion(countryCode)
  if (!region) return null

  const parsed = parseSlug(slug)

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
        <LocalizedClientLink
          href="/cart"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
        >
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

  return (
    <FlowShell
      availableDimensions={Array.from(dimensions).sort()}
      dimensionCounts={dimensionCounts}
      countryCode={countryCode}
      region={region}
      cartBadge={cartBadge}
      initialSearch={
        parsed
          ? {
              width: parsed.width,
              profile: parsed.profile,
              rim: parsed.rim,
              season: parsed.season,
              qty: parsed.qty,
            }
          : undefined
      }
    />
  )
}
