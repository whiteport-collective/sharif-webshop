/**
 * Shipping zones for home delivery, measured from Drammen (3044).
 *
 * Zone assignment is based on the first two digits of the Norwegian postal code.
 * Prices and delivery times are estimates — replace with Bring Shipping Guide API
 * once a customer agreement is in place (integrasjon.norge@bring.com).
 */

export type ShippingZone = {
  zone: number
  label: string        // Display name shown to user
  region: string       // Geographic description
  price: number        // NOK, whole number
  deliveryDays: string // Estimated delivery window
}

const ZONES: Record<number, ShippingZone> = {
  1: { zone: 1, label: "Lokal levering",    region: "Oslo, Akershus, Buskerud, Vestfold",        price: 699,  deliveryDays: "1–2 dager" },
  2: { zone: 2, label: "Sør-Østlandet",     region: "Innlandet, Østfold, Telemark, Aust-Agder",  price: 799,  deliveryDays: "2–3 dager" },
  3: { zone: 3, label: "Vest- og Sørlandet",region: "Rogaland, Hordaland, Sogn og Fjordane, Møre",price: 899,  deliveryDays: "3–4 dager" },
  4: { zone: 4, label: "Midt-Norge",        region: "Trøndelag",                                  price: 999,  deliveryDays: "3–5 dager" },
  5: { zone: 5, label: "Nord-Norge",        region: "Nordland",                                   price: 1199, deliveryDays: "4–6 dager" },
  6: { zone: 6, label: "Lengst nord",       region: "Troms og Finnmark",                          price: 1399, deliveryDays: "5–7 dager" },
}

/**
 * Maps first-two-digit prefix → zone number.
 *
 * Norwegian postal code geography (approximate, distance from Drammen):
 *   00–19  Oslo og Akershus                  → Zone 1
 *   20–29  Innlandet (Hedmark/Oppland)        → Zone 2
 *   30–39  Buskerud, Vestfold, Telemark       → Zone 1  (Drammen is 3044)
 *   40–44  Telemark, Aust-Agder               → Zone 2
 *   45–49  Vest-Agder, Rogaland               → Zone 3
 *   50–59  Hordaland / Bergen                 → Zone 3
 *   60–69  Sogn og Fjordane, Møre og Romsdal  → Zone 3
 *   70–79  Trøndelag                          → Zone 4
 *   80–89  Nordland                           → Zone 5
 *   90–99  Troms og Finnmark                  → Zone 6
 */
function prefixToZone(prefix: number): number {
  if (prefix <= 19) return 1
  if (prefix <= 29) return 2
  if (prefix <= 39) return 1   // Buskerud / Drammen home territory
  if (prefix <= 44) return 2
  if (prefix <= 69) return 3
  if (prefix <= 79) return 4
  if (prefix <= 89) return 5
  return 6
}

/**
 * Returns shipping zone info for a Norwegian postal code (4 digits).
 * Returns null if the input is not a valid 4-digit Norwegian postal code.
 */
export function getShippingZone(postalCode: string): ShippingZone | null {
  const cleaned = postalCode.trim()
  if (!/^\d{4}$/.test(cleaned)) return null

  const prefix = parseInt(cleaned.substring(0, 2), 10)
  const zoneNumber = prefixToZone(prefix)
  return ZONES[zoneNumber] ?? null
}
