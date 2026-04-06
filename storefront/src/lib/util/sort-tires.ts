import { HttpTypes } from "@medusajs/types"
import { SortKey } from "@modules/products/components/tire-results-header"

function gradeScore(grade: string | undefined): number {
  return { A: 6, B: 5, C: 4, D: 3, E: 2, F: 1, G: 0 }[grade?.toUpperCase() ?? ""] ?? 0
}

export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortKey: SortKey
): HttpTypes.StoreProduct[] {
  return [...products].sort((a, b) => {
    const metaA = (a.metadata ?? {}) as Record<string, string>
    const metaB = (b.metadata ?? {}) as Record<string, string>
    const priceA = (a.variants?.[0] as any)?.calculated_price?.calculated_amount ?? 0
    const priceB = (b.variants?.[0] as any)?.calculated_price?.calculated_amount ?? 0

    switch (sortKey) {
      case "grip":
        return gradeScore(metaB.grip_rating) - gradeScore(metaA.grip_rating) || priceA - priceB
      case "fuel":
        return gradeScore(metaB.fuel_rating) - gradeScore(metaA.fuel_rating) || priceA - priceB
      case "noise":
        return Number(metaA.noise_db || 99) - Number(metaB.noise_db || 99) || priceA - priceB
      case "performance": {
        const scoreA = gradeScore(metaA.grip_rating) * 2 + gradeScore(metaA.fuel_rating)
        const scoreB = gradeScore(metaB.grip_rating) * 2 + gradeScore(metaB.fuel_rating)
        return scoreB - scoreA || priceA - priceB
      }
      case "best": {
        const scoreA = gradeScore(metaA.grip_rating) + gradeScore(metaA.fuel_rating) + (99 - Number(metaA.noise_db || 99))
        const scoreB = gradeScore(metaB.grip_rating) + gradeScore(metaB.fuel_rating) + (99 - Number(metaB.noise_db || 99))
        return scoreB - scoreA || priceA - priceB
      }
      default:
        return priceA - priceB
    }
  })
}
