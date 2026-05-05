---
name: marketing
skill_slug: sharif-marketing
domain: e-commerce
agent: shahira
owner: sharif
status: active
version: pending
---

# Marknadsföring och kampanjer

Planerar och utvärderar marknadsföring baserat på kunddata: segmentering,
kampanjtiming och budskap per målgrupp.

## Process

1. Segmentera kunder: nya vs återkommande, säsongskunder, high-value (>2 köp)
2. Identifiera bästa timing per segment baserat på historiska dialogtoppar
3. Formulera budskap per segment — däckbranschen: säkerhet + värde + enkelhet
4. Definiera mätbara KPIer för kampanjen

## Segment-definitioner

| Segment | Kriterium |
|---------|-----------|
| Ny kund | Första dialog, ingen tidigare user_id |
| Återkommande | Samma user_id, >1 dialog |
| Säsongskund | Dialoger enbart feb–apr eller sep–nov |
| High-value | >2 avslutade köp i historiken |

## Output format

```
## Kampanjförslag — [segment] [period]

**Timing:** [rekommenderat fönster]
**Budskap:** [kärnbudskap]
**KPIer:** [mätbara mål]
**Kanal:** [rekommenderad kanal]
```
