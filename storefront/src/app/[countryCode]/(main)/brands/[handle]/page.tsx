import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listCollections } from "@lib/data/collections"
import { StoreCollection } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const brandName = handle.charAt(0).toUpperCase() + handle.slice(1)

  return {
    title: `${brandName} dekk | Sharif`,
    description: `Se alle ${brandName}-modeller. Kvalitetsdekk til lave priser.`,
  }
}

export default async function BrandPage(props: Props) {
  const { handle, countryCode } = await props.params
  const brandName = handle.charAt(0).toUpperCase() + handle.slice(1)

  const { collections } = await listCollections()

  // Filter collections belonging to this brand
  const brandCollections = (collections || []).filter(
    (c: StoreCollection) => {
      const title = c.title || ""
      return title.toLowerCase().startsWith(handle.toLowerCase())
    }
  )

  if (brandCollections.length === 0) {
    notFound()
  }

  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{brandName}</h1>
        <p className="text-ui-fg-subtle mt-2">
          {brandCollections.length}{" "}
          {brandCollections.length === 1 ? "modell" : "modeller"} tilgjengelig
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {brandCollections.map((collection: StoreCollection) => {
          const modelName = collection.title?.replace(
            new RegExp(`^${brandName}\\s*`, "i"),
            ""
          )

          return (
            <LocalizedClientLink
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group"
            >
              <div className="border border-ui-border-base rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[4/3] bg-ui-bg-subtle">
                  <Thumbnail thumbnail={null} size="full" />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-bold group-hover:text-ui-fg-interactive transition-colors">
                    {modelName}
                  </h2>
                  <p className="text-sm text-ui-fg-muted mt-1">
                    {collection.title}
                  </p>
                </div>
              </div>
            </LocalizedClientLink>
          )
        })}
      </div>
    </div>
  )
}
