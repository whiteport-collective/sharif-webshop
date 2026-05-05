---
name: supabase-sharif
tool_slug: sharif-supabase
domain: database
type: api
connection_ref: SUPABASE_SERVICE_ROLE_KEY (env / Bitwarden)
approval_mode: autonomous
---

# Supabase — Sharif Schema

Direktåtkomst till sharif.* tabeller i Whiteport Agent Space
(projekt acwnjsdtfwoflndvzabq, eu-central-1).

## Connection

- **URL:** https://acwnjsdtfwoflndvzabq.supabase.co
- **Auth:** SUPABASE_SERVICE_ROLE_KEY (service role bypasses RLS)
- **Anon key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (read-only, RLS-scoped)

## Capabilities

- Read/write alla sharif.* tabeller (service role)
- SELECT dialogs, dialog_turns, views (anon key med RLS)
- Realtime subscriptions via Supabase Realtime

## Schema: sharif.*

| Tabell | Syfte |
|--------|-------|
| agent_config | Agentpersonor och systemprompts |
| agent_skills | Versionerade skills |
| dialogs | Kundsamtal (en rad per session) |
| dialog_turns | Varje tur i originalformat |
| views | Disposable views agenten skapar |

## Limitations

- DNS/hosting inte tillgängligt via API
- Migration till eget Supabase-projekt möjlig utan strukturförändringar
