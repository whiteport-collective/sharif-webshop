import { Suspense } from "react"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"

type ProductDimensionRecord = {
  id: string
  metadata: Record<string, string> | null
}

export type StorefrontShellData = {
  availableDimensions: string[]
  cartBadge: React.ReactNode
  dimensionCounts: Record<string, number>
  region: Awaited<ReturnType<typeof getRegion>>
}

function buildDimensionIndex(products: ProductDimensionRecord[]) {
  const dimensions = new Set<string>()
  const dimensionCounts: Record<string, number> = {}

  for (const product of products) {
    const meta = product.metadata

    if (!meta?.width || !meta?.profile || !meta?.rim) {
      continue
    }

    const key = `${meta.width}/${meta.profile}R${meta.rim}`
    dimensions.add(key)
    dimensionCounts[key] = (dimensionCounts[key] ?? 0) + 1
  }

  return {
    availableDimensions: Array.from(dimensions).sort(),
    dimensionCounts,
  }
}

function buildCartBadge() {
  return (
    <Suspense
      fallback={
        <LocalizedClientLink
          href="/cart"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </LocalizedClientLink>
      }
    >
      <CartButton />
    </Suspense>
  )
}

export async function getStorefrontShellData(countryCode: string): Promise<StorefrontShellData | null> {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const headers = { ...(await getAuthHeaders()) }
  const { products } = await sdk.client.fetch<{
    products: ProductDimensionRecord[]
    count: number
  }>("/store/products", {
    method: "GET",
    query: { limit: 500, fields: "id,metadata" },
    headers,
    next: { revalidate: 3600 },
  })

  return {
    ...buildDimensionIndex(products),
    cartBadge: buildCartBadge(),
    region,
  }
}
