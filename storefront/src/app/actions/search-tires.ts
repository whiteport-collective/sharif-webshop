"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"

export type SearchTiresResult = {
  products: HttpTypes.StoreProduct[]
  count: number
  regionId: string
}

export async function searchTires(
  countryCode: string,
  width: string,
  profile: string,
  rim: string
): Promise<SearchTiresResult> {
  const region = await getRegion(countryCode)
  if (!region) return { products: [], count: 0, regionId: "" }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Call the custom /store/tires endpoint which filters by metadata in the DB.
  // Only matching products are returned — no client-side filtering needed.
  const { products, count } = await sdk.client.fetch<{
    products: HttpTypes.StoreProduct[]
    count: number
  }>("/store/tires", {
    method: "GET",
    query: {
      width,
      profile,
      rim,
      region_id: region.id,
    },
    headers,
    next: { revalidate: 3600 },
  })

  return {
    products,
    count,
    regionId: region.id,
  }
}
