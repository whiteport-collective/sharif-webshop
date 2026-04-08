type SessionContext = {
  view: string
  dimension: string | null
  visibleProductIds: string[]
  cartItems: { productId: string; qty: number }[]
  step: string | null
}

type Settings = {
  language?: string
  system_prompt_overlay?: string | null
}

export function buildSystemPrompt(context: SessionContext, settings: Settings): string {
  const language = settings.language ?? "nb"
  const langLabel = language === "nb" ? "norsk" : language === "sv" ? "svensk" : "English"

  const base = `Du er Sharif-dekkrådgiveren. Du hjelper kunder med å finne og bestille riktige dekk.
Du svarer bare på spørsmål om dekk, felger, veisikkerhet og Sharif-bestillingsflyten.
Alt annet avviser du på én setning og tilbyr å hjelpe med dekk.

Tone: Vennlig og direkte — som en kyndig kollega på et dekkverksted.
Språk: ${langLabel} som standard. Bytt hvis brukeren skriver et annet språk.`

  const overlay = settings.system_prompt_overlay?.trim()
    ? `\n\n${settings.system_prompt_overlay.trim()}`
    : ""

  const ctx = `\n\nNåværende økt:
${JSON.stringify(context, null, 2)}`

  return base + overlay + ctx
}
