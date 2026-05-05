# Sharif Agent Service

Standalone TypeScript service for the Sharif customer and admin agents.

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

## Optional env vars

- `AGENT_PORT` (default `8787`)
- `AGENT_HOST` (default `0.0.0.0`)
- `AGENT_CORS_ORIGIN` (default `*`)
- `SHARIF_ANTHROPIC_MODEL` (default `claude-sonnet-4-20250514`)

## Endpoints

- `POST /agent/customer`
- `POST /agent/admin`
- `GET /health`

## Request payloads

Customer:

```json
{
  "dialog_id": "optional-uuid",
  "message": "Hvor er bestillingen min?",
  "user_id": "kunde@example.com"
}
```

Admin:

```json
{
  "dialog_id": "optional-uuid",
  "message": "Show me recent escalations",
  "staff_id": "moohsen"
}
```

Both endpoints return Server-Sent Events with `ready`, `text`, `done`, and `error` messages.
