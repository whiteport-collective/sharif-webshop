## Learned
- Feedback skill goes in WDS repo (`src/skills/feedback/SKILL.md`) not as a standalone command — travels with WDS distribution
- Bitwarden CLI pattern: `bw get template item` → python to build JSON → `bw encode | bw create item`
- agent_messages table requires `thread_id` (NOT NULL) — use `gen_random_uuid()` when inserting; body column is `content` not `body`
- Sub-agent (Claude) is right for immediate local implementation; Codex for async PR-based work
- 13-issue storefront fix batch was implemented by a sub-agent directly — all changes live in `storefront/src/`
- Scenario 03 is Admin Dashboard (not 05/06 as previously in the index)
- Purchase planning is a key feature of 03.4: agent compares current stock vs 3yr historical sales to generate buy recommendations
- Do proper WDS spec + wireframes before sending Codex WO for complex admin builds — vibe coding doesn't work here

## Context
- **Feedback skill:** Created at `C:/dev/WDS/whiteport-design-studio/src/skills/feedback/SKILL.md`
- **13-issue storefront fix:** Sub-agent completed all 13 fixes in `storefront/`. SVG logo + placeholder in `public/`, i18n extended, FlowShell menu/support/confirmation wired, checkout desktop layout, step headlines, scroll lock, Drammen auto-select, support sidebar scaffold
- **Scenario 03 Admin Dashboard:** Full structure at `design-process/C-UX-Scenarios/03-admin-dashboard/`. All 7 step folders + spec files with: screen purpose, user actions, Medusa data connections, agent tools + example queries, user scenario narratives (named, specific), open questions. 03.2 has sales chart + 8 pattern types
- **Anthropic API key:** Saved to Bitwarden as "Anthropic API Key — Sharif" + added to `backend/.env`
- **Admin Codex WO:** Not sent — paused to do proper WDS spec first (correct)
- **Old storefront WOs** (39697e4f, bbab3550): cancelled in DB, superseded by sub-agent

## Plan
Draw Excalidraw wireframes for Scenario 03, one screen at a time, user approves each before writing WDS spec. Then one Codex WO for the full admin build.

Order: 03.1 Login → 03.2 Open Glass → 03.3 Orders → 03.4 Products → 03.5 Customers → 03.6 Agent Sidebar → 03.7 Settings → full WDS spec → Codex WO

## Next
Draw wireframe 03.1 Login in Excalidraw at `design-process/C-UX-Scenarios/03-admin-dashboard/Sketches/03.1-login.excalidraw` — desktop canvas (1440×900), Sharif logo top-left, email+password form centered, minimal. Present to user for approval before 03.2.

## Spec Sync
- `00-ux-scenarios.md` updated — Scenario 03 added, old 05/06 entries removed
- All 7 scenario step files written with full meta descriptions
- `03.2-open-glass.md` extended with sales chart + patterns section
