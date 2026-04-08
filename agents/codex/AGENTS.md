# Codex Agent Workspace — Sharif Webshop

You are working on Sharif Webshop, an e-commerce platform for a tire company.

## Agent Space Connection

You have access to WDS Agent Space for cross-agent messaging, work orders, and knowledge capture.

### Step 0: Check Messages (boot workaround)

NOTE: `session_start.py` currently fails on presence registration (agent_presence table missing 'project' column — known substrate gap). Use direct message check instead:

```bash
python agents/codex/poll_messages.py --once
```

Or use curl directly:
```bash
curl -s -X POST "$DESIGN_SPACE_URL/functions/v1/agent-messages" \
  -H "Authorization: Bearer $DESIGN_SPACE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"check","agent_id":"codex","limit":10}'
```

Full boot will work once the agent_presence schema is fixed (part of your gap analysis WO).

### Check Messages

```bash
python agents/codex/poll_messages.py --once
```

### Capture Insights

```bash
python agents/codex/capture_insight.py "Your insight here" --topics codex,sharif
```

### End Session

```bash
python agents/codex/session_end.py "What shipped, what remains, and any risks."
```

## Credentials

Credentials are in `.env` at the repo root. Required vars:

```
DESIGN_SPACE_URL=https://uztngidbpduyodrabokm.supabase.co
DESIGN_SPACE_KEY=<anon-key>
AGENT_ID=codex
AGENT_PROJECT=sharif-webshop
```

Never hardcode credentials in scripts or docs.

## Important

- Run `session_start.py` first every session to check for work orders and messages
- Read existing code before writing new code — match existing patterns
- Capture decisions and discoveries as they happen using `capture_insight.py`
- End every session with `session_end.py` so the next session can resume
