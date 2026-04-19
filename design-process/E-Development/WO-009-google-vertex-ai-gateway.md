# WO-009 — Google Vertex AI Gateway

**Status:** Ready  
**Assigned to:** Mimir  
**Created:** 2026-04-15  
**Priority:** High — blocks admin chat and Open Glass

---

## Problem

Anthropic API-krediter är slut. Systemet behöver byta till Google Vertex AI (samma GCP-faktura som redan används). Gatewayen (`tool-anthropic` edge function) är delvis byggt men har två återstående problem:

1. **IAM-behörighet saknas** — service account `whiteport-gdrive@whiteport-media.iam.gserviceaccount.com` saknar rollen `Vertex AI User` på projektet `whiteport-media`. Alla anrop returnerar 403 `aiplatform.endpoints.predict` PERMISSION_DENIED.

2. **Streaming stöds inte** — gatewayen returnerar vanlig JSON för Google-anrop. Admin-chatten använder `streamText` (AI SDK) som kräver Anthropic SSE-format. Utan streaming kraschar admin-chatten helt.

---

## Vad som redan är gjort

- `tool-anthropic` edge function omskriven till provider-agnostisk gateway (deployad, version 9)
- `AI_PROVIDER=google`, `GOOGLE_SERVICE_ACCOUNT_SHARIF`, `GOOGLE_PROJECT=whiteport-media`, `GOOGLE_LOCATION=europe-west1`, `GOOGLE_MODEL=gemini-2.0-flash-001` satta som Supabase secrets
- Vertex AI API aktiverat på projektet `whiteport-media`
- Format-translation Anthropic → Gemini → Anthropic implementerat i gatewayen (för `generateText`-anrop)
- Health endpoint fungerar och bekräftar att service account är laddad

---

## Uppgifter

### Task 1 — IAM-behörighet (kräver manuell åtgärd av Mårten)

Mårten måste i GCP Console göra detta:

1. Gå till `https://console.cloud.google.com/iam-admin/iam?project=whiteport-media`
2. Hitta `whiteport-gdrive@whiteport-media.iam.gserviceaccount.com`
3. Lägg till rollen **Vertex AI User**
4. Spara

**Alternativ:** Skapa en ny dedikerad service account `sharif-ai@whiteport-media.iam.gserviceaccount.com` med rollen Vertex AI User, exportera JSON-nyckel, och ersätt `GOOGLE_SERVICE_ACCOUNT_SHARIF` i Supabase secrets.

### Task 2 — Streaming-stöd i gatewayen

Uppdatera `c:/dev/WDS/design-space/database/supabase/functions/tool-anthropic/index.ts` så att Google-anrop stödjer SSE streaming:

- Detektera `"stream": true` i request body
- Om streaming: anropa Vertex streaming endpoint (`...generateContent?alt=sse`), översätt Gemini SSE-chunks till Anthropic SSE-format (`event: content_block_delta`, `data: {"delta":{"type":"text_delta","text":"..."}}`)
- Om inte streaming: befintlig JSON-path funkar kvar
- Deploya till `uztngidbpduyodrabokm`

### Task 3 — Verifiera admin-chatten

Efter Task 1 + 2: testa admin-chatten i `http://localhost:9000/app`:
- Skicka ett enkelt meddelande
- Bekräfta SSE-stream fungerar end-to-end
- Bekräfta svar renderas i UI

### Task 4 — Verifiera Open Glass

Testa Open Glass briefing-pipeline:
- Trigga en briefing via `GET /api/admin/briefing`
- Bekräfta att `interpret.ts` och `compose.ts` anropar gatewayen och får svar
- Bekräfta schema genereras utan truncation-fel

---

## Teknisk kontext

**Gateway URL:** `https://uztngidbpduyodrabokm.supabase.co/functions/v1/tool-anthropic`  
**Gateway källkod:** `c:/dev/WDS/design-space/database/supabase/functions/tool-anthropic/index.ts`  
**Backend runtime:** `c:/dev/Sharif/sharif-webshop/backend/src/lib/admin-agent/runtime.ts`  
**Admin chat route:** `c:/dev/Sharif/sharif-webshop/backend/src/api/admin/agent/chat/route.ts`  
**Open Glass compose:** `c:/dev/Sharif/sharif-webshop/backend/src/lib/open-glass/compose.ts`  
**Open Glass interpret:** `c:/dev/Sharif/sharif-webshop/backend/src/lib/open-glass/interpret.ts`

**Supabase projekt:** `uztngidbpduyodrabokm` (Agent Space / Design Space)  
**GCP projekt:** `whiteport-media`  
**Service account:** `whiteport-gdrive@whiteport-media.iam.gserviceaccount.com`  
**Vertex modell:** `gemini-2.0-flash-001` i `europe-west1`

**Anthropic SSE format som AI SDK förväntar sig:**
```
event: message_start
data: {"type":"message_start","message":{...}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{...}}

event: message_stop
data: {"type":"message_stop"}
```

**Gemini SSE format (Vertex streaming):**
```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}},...]}
```

---

## Verify Criteria

- `curl .../tool-anthropic/health` returnerar `{"ok":true,"provider":"google",...}`
- `curl -X POST .../tool-anthropic/messages` med `stream:true` returnerar korrekt Anthropic SSE-stream
- Admin-chatten i `/app` svarar på ett meddelande utan fel
- Open Glass genererar ett schema utan truncation
