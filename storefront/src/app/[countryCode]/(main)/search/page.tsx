import React from "react"
import { Metadata } from "next"
import Link from "next/link"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import TireCard from "@modules/products/components/tire-card"
import TireCarousel from "@modules/products/components/tire-carousel"
import TireResultsHeader from "@modules/products/components/tire-results-header"
import type { SortKey } from "@modules/products/lib/tire-sorting"
import { sortProducts } from "@lib/util/sort-tires"
import { Pagination } from "@modules/store/components/pagination"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{
    w?: string
    p?: string
    r?: string
    q?: string
    qty?: string
    season?: string
    sort?: string
    page?: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { w, p, r, q } = await props.searchParams
  const dimension = w && p && r ? `${w}/${p}R${r}` : q || ""

  return {
    title: dimension ? `${dimension} dekk | Sharif` : "Søk dekk | Sharif",
    description: `Finn dekk i størrelsen ${dimension}. Beste priser, montering inkludert.`,
  }
}

function parseDimension(query: string): {
  width: string
  profile: string
  rim: string
} | null {
  const cleaned = query.replace(/[^\d\/rRzZ\s]/g, "").trim()
  const match = cleaned.match(
    /(\d{2,3})\s*[\/\s]\s*(\d{2})\s*[\/\s]?\s*[rRzZ]*\s*(\d{2})/
  )
  if (!match) return null
  return { width: match[1], profile: match[2], rim: match[3] }
}

function buildEditUrl(
  countryCode: string,
  params: { w?: string; p?: string; r?: string; qty?: string; season?: string }
): string {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][]
  ).toString()
  return `/${countryCode}?${qs}`
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const { w, p, r, q, qty, season, sort, page } = await props.searchParams

  let width = w
  let profile = p
  let rim = r

  if (!width && q) {
    const parsed = parseDimension(q)
    if (parsed) {
      width = parsed.width
      profile = parsed.profile
      rim = parsed.rim
    }
  }

  const dimension = width && profile && rim ? `${width}/${profile}R${rim}` : ""
  const searchQuery = dimension || q || ""
  const quantity = qty?.trim() || "4"
  const seasonLabel = season?.trim() || "sommer"
  // Spec: "{width}/{profile}R{rim} {season}" e.g. "205/55R16 Sommer"
  const seasonDisplay =
    seasonLabel.charAt(0).toUpperCase() + seasonLabel.slice(1)
  const pageNumber = Math.max(Number.parseInt(page || "1", 10) || 1, 1)
  const pageSize = 24

  const region = await getRegion(countryCode)
  if (!region) return null

  const { response } = await listProducts({
    countryCode,
    queryParams: { limit: 500 },
  })

  // Filter by metadata when a structured dimension is provided (same logic as availableDimensions)
  const allProducts = width && profile && rim
    ? response.products.filter((p) => {
        const meta = (p.metadata ?? {}) as Record<string, string>
        return meta.width === width && meta.profile === profile && meta.rim === rim
      })
    : response.products

  const validSortKeys: SortKey[] = ["price", "best", "grip", "fuel", "noise", "performance"]
  const activeSort: SortKey = validSortKeys.includes(sort as SortKey) ? (sort as SortKey) : "price"

  const sorted = sortProducts(allProducts, activeSort)

  const totalPages = Math.max(Math.ceil(allProducts.length / pageSize), 1)
  const editUrl = buildEditUrl(countryCode, { w, p, r, qty, season })

  return (
    <div>
      {/* Sticky dimension summary bar */}
      {dimension && (
        <div className="sticky top-0 z-10 border-b border-ui-border-base bg-ui-bg-base/95 backdrop-blur">
          <div className="content-container flex items-center justify-between py-3">
            <span className="font-medium text-ui-fg-base">
              {dimension} {seasonDisplay}
            </span>
            <Link
              href={editUrl}
              className="text-sm font-medium text-ui-fg-interactive hover:underline"
            >
              Endre
            </Link>
          </div>
        </div>
      )}

      {allProducts.length === 0 ? (
        <div className="content-container py-16 text-center">
          <p className="text-lg text-ui-fg-base">
            Vi har ikke {dimension || "den størrelsen"} akkurat nå.
          </p>
          <p className="mt-2 text-sm text-ui-fg-subtle">
            Prøv en annen størrelse, eller ring oss på{" "}
            <a href="tel:+4793485790" className="font-medium underline">
              +47 934 85 790
            </a>
            .
          </p>
          <Link
            href={editUrl}
            className="mt-6 inline-block rounded-lg bg-ui-button-neutral px-5 py-2.5 text-sm font-medium text-ui-button-neutral-fg hover:bg-ui-button-neutral-hover"
          >
            Endre størrelse
          </Link>
        </div>
      ) : (
        <>
          {/* Results header — "{n} dekk funnet" + Sort button */}
          <TireResultsHeader count={allProducts.length} activeSort={activeSort} />

          {/* Mobile: swipe carousel + dot indicator */}
          <div className="md:hidden">
            <TireCarousel count={sorted.length}>
              {sorted.map((product) => (
                <div
                  key={product.id}
                  className="w-[72vw] max-w-[300px] flex-none snap-start self-stretch pl-4"
                >
                  <TireCard product={product} region={region} qty={Number(quantity)} />
                </div>
              ))}
            </TireCarousel>
          </div>

          {/* Tablet+: grid */}
          <div className="content-container hidden pb-8 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {sorted.map((product) => (
              <TireCard key={product.id} product={product} region={region} qty={Number(quantity)} />
            ))}
          </div>
        </>
      )}

      {allProducts.length > pageSize && (
        <div className="content-container pb-8">
          <Pagination
            page={pageNumber}
            totalPages={totalPages}
            data-testid="search-pagination"
          />
        </div>
      )}
    </div>
  )
}
