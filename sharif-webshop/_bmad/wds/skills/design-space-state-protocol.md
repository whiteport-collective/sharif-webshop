# Design Space State Protocol

Shared protocol for all WDS agents. Ensures continuity across sessions by reading and writing operational state to Design Space.

---

## On Session Start (Boot Sequence)

Every agent session begins with a Design Space boot. This is non-negotiable.

### 1. Detect workspace repos

Identify all repos in the current workspace from git remotes or working directories.

### 2. Read manifest

Query: `category = 'manifest'`

The manifest contains the current Design Space schema, conventions, and a changelog of recent system changes. If anything has changed since the agent instructions were last synced, the manifest is the source of truth.

### 3. Read state for all workspace repos

Query: `category LIKE 'state/%' AND repo IN ({workspace-repos}, '*') ORDER BY created_at DESC`

For each repo, understand:
- **state/current** — Where we are now (last session's output)
- **state/plan** — Where we're heading
- **state/blocker** — What's stopping us
- **state/retro** — How did it go last time
- **state/vision** — Definition of done

### 4. Read taste constraints

Query: `category = 'client_feedback' AND repo IN ({workspace-repos}, '*')`

These are REJECTION rules that must be respected in all output.

### 5. Report to user

After reading Design Space, the agent MUST present a brief status report showing:

- What repos are in the workspace
- Key state per repo (1-2 lines each): what happened last, any blockers, current plan
- Any system changes from the manifest that are new
- What the agent is ready to help with

**The purpose is to show the user that the agent is warmed up, aware, and ready to work — not starting from zero.**

Example (Saga):
```
Hej! Jag har kollat Design Space.

📍 kalla-fordonsservice: Om-oss-sidan levererad av Codex, QA godkänd. Nästa: kontaktsidan.
📍 whiteport-astro: Inga blockers. Senaste: Hero-sektionen uppdaterad förra veckan.
📍 agent-space: Repo-kolumn tillagd i Design Space, alla 261 entries klassificerade.

🔧 Systemuppdatering: Design Space har nu `repo`-fält på alla entries. Wildcard `*` = gäller alla repos.

Vad vill du jobba med?
```

Example (Ivonne):
```
Hej Mårten. Kollat Design Space.

📍 martens-documents: Veckoplanering W11 pågår. Inga blockers.
🔥 kalla-fordonsservice: Blocker sedan 2 dagar — väntar på bilder från kund.
📬 3 olästa mail, möte med Sharif kl 15.

Vad tar vi först?
```

The report should be concise — not a wall of text. Prioritize fires and recent changes.

---

## During Work

When making significant decisions or encountering blockers, write to Design Space immediately:

```
category: state/blocker
repo: {repo-name}
project: {project-name}
content: "Waiting for API key from client before proceeding with Shopify integration"
```

Do not wait until session end. State should be live and queryable by other agents at all times.

---

## On Session End

Before closing, write a state summary:

```
category: state/current
repo: {repo-name}
project: {project-name}
content: "Completed Phase 3 scenarios for checkout flow. 4 of 6 scenarios done. Next: payment and confirmation screens."
```

Include:
- What was accomplished
- What remains
- Any blockers or decisions pending
- Suggested next action

---

## Field Usage

| Field | Value | Purpose |
|-------|-------|---------|
| `category` | `state/current`, `state/plan`, `state/blocker`, `state/retro`, `state/vision` | Type of state |
| `repo` | Git repo name, or `*` for global | Where the work happened |
| `project` | Project name, e.g. `kalla`, `whiteport` | Why the work is being done |
| `designer` | Agent name, e.g. `saga`, `freya`, `ivonne` | Who wrote the state |
| `content` | Free text | The actual state information |

---

## Cross-Agent Awareness

The boot sequence reads state from ALL agents across ALL workspace repos. This enables:

- Saga seeing that Freya hit a UX blocker
- Freya seeing that Saga updated the product brief
- Ivonne seeing that a project has been inactive for a week
- Any agent seeing system changes from the manifest

State entries are shared across all agents by default. There is no agent-private state.

---

## Manifest

The manifest (`category = 'manifest'`) is a special entry that describes the current Design Space system — schema, conventions, changelog. It is maintained by the system owner and updated when the Design Space infrastructure changes.

Agents should read the manifest at every session start. If it contains information that contradicts the agent's built-in instructions, **the manifest takes precedence** — it is the most up-to-date source.
