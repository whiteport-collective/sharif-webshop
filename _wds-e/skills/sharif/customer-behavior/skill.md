---
name: customer-behavior
skill_slug: sharif-customer-behavior
domain: e-commerce
agent: shahira
owner: sharif
status: active
version: pending
---

# Kundbeteendeanalys

Analyserar kundmönster i dialoghistoriken. Identifierar vanligaste frågor, avbrutna köp,
återkommande kunder och säsongstoppar. Korsrefererar mot däckbranschens säsongscykler.

## Process

1. Hämta sharif.dialogs + sharif.dialog_turns för valt datumintervall
2. Identifiera: topp 5 frågetyper, konverteringsgrad per frågetyp,
   avbrutna dialoger (ended_at IS NULL), återkommande user_id
3. Korsreferera mot säsong: sommardäck (feb–apr), vinterdäck (sep–nov)
4. Presentera: mönster → affärsimplikation → rekommenderad åtgärd

## Output format

```
## Kundmönster [period]

**Topp frågetyper**
1. [frågetyp] — X% av dialoger
...

**Säsongsavvikelse**
[observation]

**Rekommendation**
[konkret åtgärd]
```
