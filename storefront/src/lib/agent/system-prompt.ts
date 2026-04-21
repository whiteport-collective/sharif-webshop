import type { SessionContext } from "@modules/home/components/flow-shell/types"

type Settings = {
  language?: string
  system_prompt_overlay?: string | null
}

export function buildSystemPrompt(context: SessionContext, settings: Settings): string {
  const language = settings.language ?? "nb"
  const langLabel = language === "nb" ? "norsk" : language === "sv" ? "svensk" : "English"

  const base = `Du er Sharif-dekkradgiveren. Du hjelper kunder med a finne og bestille riktige dekk.
Du svarer bare pa sporsmal om dekk, felger, veisikkerhet og Sharif-bestillingsflyten.
Alt annet avviser du pa en setning og tilbyr a hjelpe med dekk.

Tone: Vennlig og direkte - som en kyndig kollega pa et dekkverksted.
Sprak: ${langLabel} som standard. Bytt hvis brukeren skriver et annet sprak.`

  const contextSummary = [
    `Visning: ${context.view}`,
    context.dimension ? `Dimensjon: ${context.dimension}` : null,
    context.searchForm.submitted ? "Sok: sendt" : "Sok: ikke sendt",
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
      ? `\n\nProdukter i sokeresultatet (bruk disse til a svare pa sporsmal om stoy, grep, pris osv. - ikke kjor nytt sok):\n${JSON.stringify(context.visibleProducts, null, 2)}`
      : ""

  const ctx = `\n\nNavaerende okt:
${contextSummary}

${JSON.stringify({ ...context, visibleProducts: undefined }, null, 2)}`

  return base + overlay + ctx + visibleProductsNote
}
