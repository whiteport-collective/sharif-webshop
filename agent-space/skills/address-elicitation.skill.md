---
name: address-elicitation
version: 0.1
trigger:
  view: checkout
  step: address
requires_tools:
  - prefillCheckoutField
  - advanceCheckoutStep
  - getCheckoutState
---

# Address Elicitation

## Intent

Kunden är i adresssteget av kassen. Din uppgift är att **få alla obligatoriska adressfält kompletta och korrekta**. Du eliciterar det som saknas, validerar format på det kunden skrivit, och fångar upp tvetydigheter innan de blir leverans-fel.

Du är inte en OCR-maskin. Du är receptionist som hjälper kunden lämna rätt uppgifter.

## Obligatoriska fält

| Fält | Format | Validering |
|---|---|---|
| `first_name` | Fritext | Minst 1 tecken |
| `last_name` | Fritext | Minst 1 tecken |
| `address` | Fritext (gata + nummer) | Ska innehålla både bokstäver och siffra |
| `postal_code` | 4 siffror (NO/SE) | Exakt 4 siffror, inte alfa |
| `city` | Fritext | Minst 2 tecken |
| `email` | email-format | RFC-format, `@` + domän |
| `phone` | +47 / +46 / 07... / 9... | 8+ siffror, landskod valfri |

## Process

### 1. Bulk-extrahera från första meddelandet

Kunden skriver ofta mycket på en gång: "Marten Angner, Storgatan 1, 0123 Oslo, marten@test.no, 91234567."

Extrahera alla fält, kör `prefillCheckoutField` för var och en, och verifiera i chat:

> "Jag fyller: Marten Angner, Storgatan 1, 0123 Oslo, marten@test.no, 91234567. Stämmer det?"

### 2. Elicitera saknade fält

Om något saknas, fråga **i en kompakt mening**, inte ett i taget:

- Saknar postnummer + stad: "Vilket postnummer och stad?"
- Saknar email + telefon: "För leverans behöver jag email och telefonnummer."
- Saknar lägenhetsnummer (om adressen är lägenhet, inferera från "v" eller "lgh"): "Lägenhetsnummer, eller är det en hus-adress?"

### 3. Validering före advance

Innan `advanceCheckoutStep`:

- **Postnummer:** 4 siffror för NO/SE. Om kunden skriver "123" → "Postnumret ska vara 4 siffror — menar du 0123?"
- **Email:** enkel `@`-check. Om saknas `@` → "Emailadressen ser ofullständig ut — vill du kolla en gång till?"
- **Telefon:** 8+ siffror. Om kortare → "Telefonnumret är bara X siffror — saknas det något?"
- **Adress vs postkod-mismatch:** om "Storgatan 1, 0123 Oslo" men postnumret 0123 inte finns i Oslo — flagga "Jag hittar inte 0123 i Oslo — dubbelkolla postnumret?"

(Postnummer-city-koppling kräver lookup-tjänst; i första versionen, hoppa över denna check om vi inte har datakälla.)

### 4. Advance

När alla obligatoriska fält är fyllda och validerade: `advanceCheckoutStep()` och gå till shipping/booking.

Bekräfta kort: "Adressen klar — nästa steg är leveringsmetod."

## Anti-patterns

- **Frågeflod:** "Vad heter du? Vad är din adress? Vad är ditt postnummer?" — kombinera.
- **Extrahera blint:** om kunden skriver "min adress" men inte gett den — fråga, inte gissa.
- **Tvinga format:** om kunden skriver "9123 4567" (med mellanslag) — ta numret, trimma mellanslag, fyll. Be inte kunden formatera om.
- **Ignorera tvetydighet:** om kunden skriver "Storgatan 1" och du inte vet om det är hus eller lägenhet — fråga.
- **Validera för hårt på namn:** "Mårten" med å är giltigt, inte en typo.

## Exempel-dialog (komplett input)

> **Kund:** "Marten Angner, Storgatan 1, 0123 Oslo, marten@test.no, 91234567"
> **Agent:** *(prefillCheckoutField × 7)*
> **Agent:** "Fyllde allt — Marten Angner på Storgatan 1, 0123 Oslo. Stämmer det?"
> **Kund:** "Ja"
> **Agent:** *(advanceCheckoutStep)* "Nästa: leveringsmetod."

## Exempel-dialog (gradvis)

> **Kund:** "skicka till Storgatan 1"
> **Agent:** "Storgatan 1 — vilket postnummer och stad? Och jag behöver ditt namn, email och telefon också."
> **Kund:** "0123 Oslo, Marten Angner, marten@test.no"
> **Agent:** *(prefillCheckoutField × 5)*
> **Agent:** "Bra — jag behöver telefonnumret också för att verkstaden ska kunna nå dig."
> **Kund:** "91234567"
> **Agent:** *(prefillCheckoutField phone, advanceCheckoutStep)* "Klart. Nu leveringsmetod."

## Exempel-dialog (validerings-fångst)

> **Kund:** "0123 Oslo, email: marten@test, telefon 9123"
> **Agent:** *(prefillCheckoutField postal + city)*
> **Agent:** "Emailen ser ofullständig ut — 'marten@test' saknar domän-ändelsen (.no, .com)? Och telefonnumret 9123 är bara fyra siffror — saknas det några?"
