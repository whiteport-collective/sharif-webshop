import { Metadata } from "next"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { StoreCollection } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Brands | Sharif",
  description: "Browse tires by brand",
}

type BrandGroup = {
  name: string
  handle: string
  collections: StoreCollection[]
}

function groupCollectionsByBrand(
  collections: StoreCollection[]
): BrandGroup[] {
  const brands = new Map<string, BrandGroup>()

  for (const collection of collections) {
    // Extract brand from collection title: "Powertrac ADAMAS H/P" → "Powertrac"
    const title = collection.title || ""
    const firstSpace = title.indexOf(" ")
    const brandName = firstSpace > 0 ? title.substring(0, firstSpace) : title
    const brandHandle = brandName.toLowerCase()

    if (!brands.has(brandHandle)) {
      brands.set(brandHandle, {
        name: brandName,
        handle: brandHandle,
        collections: [],
      })
    }
    brands.get(brandHandle)!.collections.push(collection)
  }

  return Array.from(brands.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export default async function BrandsPage() {
  const { collections } = await listCollections()
  const brands = groupCollectionsByBrand(collections || [])

  return (
    <div className="content-container py-12">
      <h1 className="text-3xl font-bold mb-2">Våre merker</h1>
      <p className="text-ui-fg-subtle mb-8">
        Utforsk vårt utvalg av dekk sortert etter merke.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <LocalizedClientLink
            key={brand.handle}
            href={`/brands/${brand.handle}`}
            className="group border border-ui-border-base rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-bold group-hover:text-ui-fg-interactive transition-colors">
              {brand.name}
            </h2>
            <p className="text-ui-fg-subtle mt-2">
              {brand.collections.length}{" "}
              {brand.collections.length === 1 ? "modell" : "modeller"}
            </p>
            <ul className="mt-4 space-y-1">
              {brand.collections.slice(0, 5).map((c) => (
                <li key={c.id} className="text-sm text-ui-fg-muted">
                  {c.title?.replace(brand.name + " ", "")}
                </li>
              ))}
              {brand.collections.length > 5 && (
                <li className="text-sm text-ui-fg-interactive">
                  +{brand.collections.length - 5} till...
                </li>
              )}
            </ul>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
