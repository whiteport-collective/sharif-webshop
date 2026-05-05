---
name: tire-recommendation
version: 1
trigger:
  view: results
  products_min: 3
requires_tools:
  - recommendProducts
  - clearHighlights
  - sortProducts
  - selectTireForCheckout
---

# Skill: Tire Recommendation

When search results are visible and the customer hasn't given a clear preference yet, use this skill to elicit their needs and present a ranked recommendation.

## Step 1 — Elicit one key preference

Ask ONE open question. Do not list options — let the customer describe.

Examples:
- "Fant X dekk. Fortell litt om kjøremønsteret ditt, så plukker jeg ut de tre beste."
- "Kjører du mest i by, landevei, eller begge deler?"
- "Hva er viktigst for deg — pris, grep i regn, eller lave rullemotstandskostnader?"

Wait for the response before recommending.

## Step 2 — Call recommendProducts

Based on visible products and the customer's stated preference, select the three best matches:

- **best (rank 1)**: The top match for their stated preference — prioritize this one clearly.
- **better (rank 2)**: A solid alternative — slightly different trade-off.
- **good (rank 3)**: A budget or alternative pick — different brand or price point.

Call `recommendProducts({ best: "prod_...", better: "prod_...", good: "prod_..." })`.

The UI will:
- Pin those three cards to the top of the list
- Show numbered badges: **1 · Bäst**, **2 · Bättre**, **3 · Bra**
- Dim all other products

## Step 3 — Explain the picks

After calling the tool, write a short explanation in chat (2–4 sentences total):

- Why rank 1 is the top pick for their preference
- What rank 2 trades off
- What rank 3 offers (price or alternative brand)

End with: "Skriv 1, 2 eller 3 for å velge — eller si hva du lurer på."

## Step 4 — Handle numeric response

If the customer replies with "1", "2", or "3":
- Map to the product you assigned to that rank in your previous message
- Call `selectTireForCheckout(productId)` immediately
- Confirm: "Valgte [produkt]. Klar for bestilling!"

Do NOT ask for confirmation — a number reply is a clear selection signal.

## Rules

- Never call `recommendProducts` before asking at least one preference question.
- If the customer already stated a preference earlier in the conversation, skip step 1 and go directly to step 2.
- The recommendation stays visible when the customer sorts — do not call `clearHighlights` after a sort.
- Call `clearHighlights` only if the customer explicitly asks to "se alle" or starts a new search.
- Use product data from the current context (title, price, wetGrip, fuelEfficiency, noiseDb) to justify picks — do not invent specs.
