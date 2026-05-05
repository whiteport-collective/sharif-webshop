---
name: sales-optimization
skill_slug: sharif-sales-optimization
domain: e-commerce
agent: shahira
owner: sharif
status: active
version: pending
---

# Försäljningsoptimering

Identifierar försäljningstapp och optimeringspotential: prisnivåer, produktmix,
up-sell/cross-sell-möjligheter, konverteringsflaskhalsar i dialogflödet.

## Process

1. Analysera dialog_turns för köpsignaler och avbrott
2. Identifiera: var i flödet kunder faller av, vilka produkter nämns men inte köps,
   prisinvändningar, leveransinvändningar
3. Korsreferera avbrutna flöden mot produktkategori och säsong
4. Föreslå: produktbuntar, säsongserbjudanden, up-sell-triggers baserade på historik
5. Prioritera åtgärder efter estimerad påverkan

## Output format

```
## Försäljningsanalys [period]

**Konverteringstapp**
- [flaskhals] → [estimerad påverkan]

**Optimeringspotential**
1. [åtgärd] — [motivering]
...
```
