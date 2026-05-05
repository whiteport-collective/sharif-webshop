---
name: dialog-history
skill_slug: sharif-dialog-history
domain: e-commerce
agent: shahira
owner: sharif
status: active
version: pending
---

# Dialoghistorik

Sök och granska specifika kunddialoger i sharif.dialogs + sharif.dialog_turns.

## Process

1. Fråga efter sökkriterier: user_id, datumintervall, nyckelord i content, audience
2. Bygg SQL-query mot sharif.dialogs JOIN sharif.dialog_turns
3. Presentera matchande dialoger med: datum, user_id, antal turns, sammanfattning
4. Erbjud att visa fullständig dialog om admin vill granska enskilt ärende

## Sökkriterier

| Kriterium | Kolumn |
|-----------|--------|
| Kund-ID | dialogs.user_id |
| Datum | dialogs.started_at |
| Nyckelord | dialog_turns.content ILIKE |
| Typ | dialogs.audience (customer/admin) |
| Avbruten | dialogs.ended_at IS NULL |

## Output format

```
## Dialogsökning — [kriterier]

Hittade X dialoger.

| Datum | Kund | Turns | Sammanfattning |
|-------|------|-------|----------------|
| [datum] | [user_id] | [n] | [1-rad-sammanfattning] |
```
