---
name: winter-tire-elicitation
version: 0.1
trigger:
  view: results
  season: vinter
  products_min: 2
requires_tools:
  - highlightProducts
  - clearHighlights
  - getProductDetail
  - selectTireForCheckout
---

# Winter Tire Elicitation

## Intent

Kunden väljer vinterdäck. Reglerna är hårdare än för sommardäck:

- Nordiska förhållanden (is, snö, slask) är farligare än våt asfalt i +15°
- Dubbdäck vs odubbat är en **lagfråga** på vissa platser och tider
- Elbil/hybrid är tyngre → kortare vinterdäcks-livslängd, högre krav på bärighet
- Nordiska märken (Nokian, Continental WinterContact) har betydligt bättre is-grepp än mellanmärken

Du eliciterar **utöver** de fyra standarddimensionerna (safety/comfort/economy/quietness) också dessa vinter-specifika beslut. Detta skill laddas **tillsammans med** `tire-needs-elicitation` när `season === "vinter"` — det ersätter inte, det kompletterar.

## Vinter-specifika dimensioner

| Dimension | Vad du frågar | Påverkar produktval |
|---|---|---|
| **Stud type** | Dubbat, odubbat, eller dubbat-vänligt (friction/studless)? | Filtrerar produktlista |
| **Driving profile** | Stadskörning, landsväg, skog/grus? | Stads-dubbat sämre; landsväg kräver bättre is-grepp |
| **Vehicle weight** | Elbil, hybrid, SUV, tyngre lastbil? | Tyngre fordon → förstärkt bärighet (`XL`-märkning) |
| **Ice priority** | Brukar det bli is på vintern där du bor? | Nordiska märken vs europeiska |

## Process

### 1. Första frågan (ersätter tire-needs-elicitation:s standardfråga)

> "Vinterdäck — då är det lite andra frågor. Är det dubbdäck eller odubbat du vill ha, och kör du mest i stan, på landsvägar eller skogsvägar?"

### 2. Följdfråga — fordonstyp

Om kunden inte nämnt bil-typ:

> "Vad har du för bil? Om det är elbil eller tung SUV behöver vi titta på XL-märkta däck."

### 3. Följdfråga — vinterförhållanden

Om kunden bor i storstad med sällan is:

> "I Oslo är det ofta mer slask än is — då finns bra europeiska alternativ som är billigare än Nokian."

Om kunden bor längre norrut eller nämner is:

> "Om du kör på is regelbundet är nordiska märken (Nokian, Continental WinterContact) märkbart säkrare."

### 4. Highlight

Som `tire-needs-elicitation:3`, men med vinter-specifikt `reason`:

```
highlightProducts(
  productIds: ["prod_x", "prod_y"],
  reason: "Nordiska odubbade med topp-is-grepp, XL-bärighet för elbil"
)
```

## Data per vinterdäcks-produkt

Utöver standardfälten från `tire-needs-elicitation`, förvänta dig:

```json
{
  "studType": "studded | studless | non-studded",
  "iceGrip": "high | medium | low",
  "snowRating": "3pmsf | m+s",
  "loadIndex": 91,
  "xlMarked": true,
  "tags": ["nordic", "euro-winter", "suv"]
}
```

Om fält saknas: `getProductDetail` eller kommentera i chat ("Jag ser inte is-greppsbetyg på den här — ska jag hämta specifikationen?").

## Anti-patterns

- **Föreslå dubbdäck utan att fråga om stadskörning** — i Oslo/Bergen centralt är dubbdäck förbjudet vissa dagar och onödigt ljudliga.
- **Standardisera på Nokian.** De är bra, men dyra. Elicitera vad kunden faktiskt behöver.
- **Ignorera elbil.** En tyngre elbil kräver förstärkt däck — om kunden inte nämnt vikt, fråga.
- **Tekniska termer utan översättning.** "3PMSF-certifierat" betyder inget för kund — säg "godkänd för nordiska vinterförhållanden".

## Exempel-dialog

> **Kund:** "Jag behöver fyra vinterdäck 225/45R18 till min Tesla."
> **Agent:** *(setSearchField × 5 + triggerSearch)*
> **Agent:** "Tesla — då är bärighet viktig, elbilar är tunga. Kör du mest i stan (Oslo/Bergen?) eller på landsväg, och vill du ha dubbat eller odubbat?"
> **Kund:** "Odubbat, bor i Trondheim, mycket landsväg."
> **Agent:** *(highlightProducts(["prod_nokian_hakka_r5_ev", "prod_michelin_xice_snow"], "Odubbade XL för elbil + topp-isgrepp för nordisk landsväg"))*
> **Agent:** "Båda är XL-märkta och certifierade för nordiska förhållanden. Nokian Hakkapeliitta R5 EV är specialanpassad för elbilar — tystare och något dyrare. Michelin X-Ice Snow är en klassiker som är 20% billigare. Har du kört Nokian förut?"

## Kompletterar inte ersätter

Denna skill laddas **tillsammans med** `tire-needs-elicitation`. Om vinter-specifika frågor är klara men kunden vill också prata om ljudnivå — använd standardskillens dimensioner. Hoppa inte mellan skills, men låt båda informera svaren.
