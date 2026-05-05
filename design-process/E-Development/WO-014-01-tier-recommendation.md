# WO-014-01: AI Tier Recommendation — 1·Bäst, 2·Bättre, 3·Bra

**Status:** Ready for browser verification  
**Branch:** codex/orders-advanced-filter-optimizations  
**Dato:** 2026-05-05

---

## Hva er levert

Freya har implementert nytt `recommendProducts`-system for AI-drevet dekkrekommendation.

### Nye filer / endringer

| Fil | Hva |
|-----|-----|
| `storefront/src/lib/agent/tools.ts` | Nytt `recommendProducts`-tool (best/better/good), lagt til `UI_TOOL_NAMES` |
| `storefront/src/modules/home/components/agent-panel/AgentToolContext.tsx` | Ny `recommendProducts` handler-type |
| `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts` | Dispatch for `recommendProducts` tool_call |
| `storefront/src/modules/home/components/flow-shell/types.ts` | `TierRecommendation`, `TIER_CONFIG`, `TierKey` — lagt til i `ResultsSectionProps` |
| `storefront/src/modules/home/components/flow-shell/index.tsx` | `recommendations` state, `recommendProducts` handler, pass-through til FlowShellResults |
| `storefront/src/modules/home/components/flow-shell/flow-shell-results.tsx` | Pin-til-topp, dimming av ikke-anbefalte, tier-data til TireCard |
| `storefront/src/modules/products/components/tire-card/index.tsx` | Tier-badge (1·Bäst/2·Bättre/3·Bra), ring-farging per tier |
| `agent-space/skills/tire-recommendation.skill.md` | Skill som instruerer agenten |

---

## Brukerflyt

1. Bruker søker 205/55R16, 9 dekk vises
2. Agent spør: *"Kjører du mest by eller landevei?"*
3. Bruker svarer: *"Mest by, men noen lengre turer"*
4. Agent kaller `recommendProducts({ best: "prod_X", better: "prod_Y", good: "prod_Z" })`
5. UI: de 3 kortene flyttes til toppen, får badge **1·Bäst / 2·Bättre / 3·Bra**, resten tones ned (opacity-40)
6. Agent forklarer valgene i chatten, avslutter med: *"Skriv 1, 2 eller 3 for å velge."*
7. Bruker skriver **2** → agent kaller `selectTireForCheckout(prod_Y)` → checkout åpnes

---

## Sortering ved aktiv rekommendation

- De 3 anbefalte kortene er **pinnet til toppen** uavhengig av sort-valg
- Resten av lista sorteres normalt under dem
- Rekommendasjonen fjernes kun ved `clearHighlights` (nytt søk eller eksplisitt "vis alle")

---

## Done criteria (verifiser i browser)

- [ ] Agent stiller preferansespørsmål FØR den kaller recommendProducts
- [ ] De 3 kortene flyttes til topp i lista
- [ ] Badge vises: **1·Bäst** (gull), **2·Bättre** (sølv), **3·Bra** (bronse)
- [ ] Resterende kort er tydelig nedtonet (opacity-40)
- [ ] Ring/skygge skiller seg visuelt mellom tier 1, 2 og 3
- [ ] Sortering endrer rekkefølge på de nedtonede kortene men ikke de 3 pinnede
- [ ] Bruker kan skrive "1", "2" eller "3" og agenten velger riktig produkt
- [ ] `clearHighlights` (ny søk) fjerner alle tiers og dimming
