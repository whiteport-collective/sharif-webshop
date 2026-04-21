import { HttpTypes } from "@medusajs/types"

export type AgentProductPayload = {
  id: string
  title: string
  brand: string
  brandTier: "premium" | "mid" | "budget"
  price: number | null
  priceRank: number
  noiseDb: number | null
  noiseClass: "A" | "B" | "C" | null
  fuelClass: string | null
  wetGripClass: string | null
  mileageRating: "high" | "medium" | "low"
  strengths: string[]
}

type TireMeta = {
  fuel_rating?: string
  grip_rating?: string
  noise_db?: string | number
}

const PREMIUM_BRANDS = new Set([
  "continental",
  "michelin",
  "bridgestone",
  "goodyear",
  "pirelli",
  "dunlop",
])

const MID_BRANDS = new Set([
  "kumho",
  "hankook",
  "falken",
  "yokohama",
  "toyo",
  "nokian",
  "cooper",
  "general",
])

function brandTierFor(brand: string): AgentProductPayload["brandTier"] {
  const key = brand.trim().toLowerCase()
  if (PREMIUM_BRANDS.has(key)) return "premium"
  if (MID_BRANDS.has(key)) return "mid"
  return "budget"
}

function mileageFor(tier: AgentProductPayload["brandTier"]): AgentProductPayload["mileageRating"] {
  if (tier === "premium") return "high"
  if (tier === "mid") return "medium"
  return "low"
}

function noiseClassFor(db: number | null): AgentProductPayload["noiseClass"] {
  if (db === null || Number.isNaN(db)) return null
  if (db < 68) return "A"
  if (db <= 71) return "B"
  return "C"
}

function gradeScore(grade: string | null | undefined): number {
  if (!grade) return 0
  return { A: 6, B: 5, C: 4, D: 3, E: 2, F: 1, G: 0 }[grade.toUpperCase()] ?? 0
}

function strengthsFor(
  wetGrip: string | null,
  fuel: string | null,
  noiseDb: number | null,
  tier: AgentProductPayload["brandTier"]
): string[] {
  const tags: string[] = []
  if (gradeScore(wetGrip) >= 5) tags.push("wet-safety")
  if (gradeScore(fuel) >= 5) tags.push("fuel-efficient")
  if (noiseDb !== null && noiseDb < 69) tags.push("low-noise")
  if (tier === "premium") tags.push("premium-brand")
  if (tier === "budget") tags.push("value")
  return tags
}

function extractBrand(title: string | null | undefined): string {
  if (!title) return ""
  return title.split(/\s+/)[0] ?? ""
}

function extractPrice(product: HttpTypes.StoreProduct): number | null {
  const variant = (product.variants?.[0] ?? {}) as any
  const amount = variant?.calculated_price?.calculated_amount
  return typeof amount === "number" ? amount : null
}

export function enrichProductsForAgent(
  products: HttpTypes.StoreProduct[]
): AgentProductPayload[] {
  const withPrice = products.map((product) => {
    const meta = (product.metadata ?? {}) as TireMeta
    const brand = extractBrand(product.title)
    const tier = brandTierFor(brand)
    const price = extractPrice(product)
    const noiseDb = meta.noise_db !== undefined && meta.noise_db !== ""
      ? Number(meta.noise_db)
      : null
    const wetGrip = meta.grip_rating ?? null
    const fuel = meta.fuel_rating ?? null

    return {
      id: product.id ?? "",
      title: product.title ?? "",
      brand,
      brandTier: tier,
      price,
      noiseDb: Number.isFinite(noiseDb as number) ? (noiseDb as number) : null,
      noiseClass: noiseClassFor(Number.isFinite(noiseDb as number) ? (noiseDb as number) : null),
      fuelClass: fuel,
      wetGripClass: wetGrip,
      mileageRating: mileageFor(tier),
      strengths: strengthsFor(
        wetGrip,
        fuel,
        Number.isFinite(noiseDb as number) ? (noiseDb as number) : null,
        tier
      ),
    }
  })

  // Rank by ascending price: 1 = cheapest. Products without a price get the worst rank.
  const sorted = [...withPrice]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const pa = a.p.price ?? Number.POSITIVE_INFINITY
      const pb = b.p.price ?? Number.POSITIVE_INFINITY
      return pa - pb
    })

  const rankById = new Map<string, number>()
  sorted.forEach(({ p }, idx) => {
    rankById.set(p.id, idx + 1)
  })

  return withPrice.map((p) => ({
    ...p,
    priceRank: rankById.get(p.id) ?? 0,
  }))
}
