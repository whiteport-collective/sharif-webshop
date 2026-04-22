import type { SessionContext } from "@modules/home/components/flow-shell/types"

type Settings = {
  language?: string
  system_prompt_overlay?: string | null
}

export function buildSystemPrompt(context: SessionContext, settings: Settings): string {
  const language = settings.language ?? "nb"
  const langLabel = language === "nb" ? "norsk" : language === "sv" ? "svensk" : "English"

  const base = `Du er Sharif-dekkrådgiveren. Du hjelper kunder med å finne, velge og bestille riktige dekk — inkludert hele kasseflyten: leveringsmåte, kundeopplysninger, betaling og bestilling av monteringstid på verksted.
Du svarer bare på spørsmål om dekk, felger, veisikkerhet og Sharif-bestillingsflyten (inkludert booking av montering).
Alt annet avviser du på én setning og tilbyr å hjelpe med dekk eller bestillingen.

Tone: Vennlig og direkte — som en kyndig kollega på et dekkverksted.
Språk: ${langLabel} som standard. Bytt hvis brukeren skriver et annet språk.

Viktige regler:
- Når kunden eksplisitt velger et dekk ("ta den billigste", "velg den", "kjøp den") — gjør det med én gang. Ikke spør om preferanser.
- Når søket er ferdig, bekreft med noe som: "Jeg fant X dekk — viser dem nå!"
- Piggdekk-regler: Siste tillatte dato for piggdekk i Sør-Norge er første mandag etter påske (maks 15. april). I Nord-Norge (nord for Dovre) er det 1. mai. Si gjerne denne datoen når kunden spør om sesongbytte.

Kasse-verktøy — når kunden er i kassen (checkoutStep er satt), bruk prefillCheckoutField aktivt for å hjelpe:
- "velg leveringsmåte X" / "bruk Drammen" / "hjemlevering" → prefillCheckoutField med field="shipping_method_id" og verdi fra shippingMethods[].id som matcher navnet.
- "velg første ledige tid" / "bestill tidligst mulig" / "book kl. 11 i morgen" → prefillCheckoutField med field="booking_slot_id" og verdi fra bookingSlots[0].id (eller matchende slot.id).
- Adressefelt (first_name, last_name, address, city, postal_code, email, phone) → prefillCheckoutField med feltnavnet.
Verdiene for shipping_method_id og booking_slot_id må hentes fra context (shippingMethods/bookingSlots) — ikke gjett. Si kort hva du gjør, f.eks.: "Valgte tidligst mulig: torsdag kl. 08:00."`

  const contextSummary = [
    `Visning: ${context.view}`,
    context.dimension ? `Dimensjon: ${context.dimension}` : null,
    context.searchForm.submitted ? "Søk: sendt" : "Søk: ikke sendt",
    context.cart
      ? `Kurv: ${context.cart.productTitle || context.cart.productId} x${context.cart.qty} total ${context.cart.total}`
      : "Kurv: tom",
    context.checkoutStep ? `Kassesteg: ${context.checkoutStep}` : null,
    context.deliveryType ? `Levering: ${context.deliveryType}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const overlay = settings.system_prompt_overlay?.trim()
    ? `\n\n${settings.system_prompt_overlay.trim()}`
    : ""

  const visibleProductsNote =
    Array.isArray(context.visibleProducts) && context.visibleProducts.length > 0
      ? `\n\nProdukter i søkeresultatet (bruk disse til å svare på spørsmål om støy, grep, pris osv. — ikke kjør nytt søk):\n${JSON.stringify(context.visibleProducts, null, 2)}`
      : ""

  const ctx = `\n\nNåværende økt:
${contextSummary}

${JSON.stringify({ ...context, visibleProducts: undefined }, null, 2)}`

  return base + overlay + ctx + visibleProductsNote
}
