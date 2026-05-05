---
name: logistics
skill_slug: sharif-logistics
domain: e-commerce
agent: shahira
owner: sharif
status: active
version: pending
---

# Logistik och leverans

Analyserar leveransrelaterade kunddialoger: förseningar, frågor om status,
reklamationer, returmönster. Identifierar logistiska flaskhalsar och säsongstoppar.

## Process

1. Filtrera dialog_turns på leverans- och returrörda fraser
   (nyckelord: leverans, frakt, försenad, retur, reklamation, spårning, status)
2. Identifiera: frekvens av leveransfrågor, tidsperioder med toppar,
   vanligaste returorsaker, genomsnittlig tid till löst ärende
3. Korsreferera mot säsong — däckbyte (apr, nov) = logistikstress-toppar
4. Rekommendera: proaktiva statusuppdateringar, FAQ-förbättringar,
   lageroptimering inför säsongstoppar

## Output format

```
## Logistikanalys [period]

**Leveransärenden**
- Frekvens: X% av dialoger
- Topperiod: [datum/vecka]

**Returmönster**
- Vanligaste orsak: [orsak]

**Rekommendation**
[konkret åtgärd]
```
