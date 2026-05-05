---
name: governance-04-agent-asset-organization
type: template
description: Template for governance doc 04 — how the org structures its agent assets. Idun writes this from conversation, not by filling in blanks.
---

# {Org Name} Agent Asset Organization
**Version 1.0 · {Date}**

---

## What This Document Covers

How {Org Name} organizes its AI agents, skills, tools, and templates — and why we chose this structure. This is a governance decision: it defines ownership, access boundaries, and accountability for our agent assets.

---

## Our Structure

{Idun writes this section from the Phase 1 conversation. It describes the chosen structure with a directory tree and explanation. Examples:}

{Solo dev: "Flat. Everything in one place. I'm the only person."}
{Small team: "Organized by business function — seo/, finance/, design/."}
{Enterprise: "Organized by region → department. National governance inherits downward."}

---

## Why This Structure

{Idun writes this section explaining the reasoning. What was considered, what was chosen, what was explicitly rejected.}

---

## Ownership Rules

| Business Function | Owner | Who Can Change |
|-------------------|-------|---------------|
| {function} | {person or role} | {who} |

---

## When to Change This Structure

This structure should be reviewed when:
- {org-specific triggers}

Any structural change requires:
1. {approval process}
2. This document is updated with the new structure and reasoning
3. Idun migrates the catalog to the new structure

---

## Relationship to WDS-E

This structure follows the WDS-E catalog architecture pattern. Idun produced it during the initial onboarding dialog. Future structural changes follow the same process — Idun facilitates, the org decides.

## Compilation Boundary

This document governs the catalog structure humans work in. The runtime substrate must not infer structure ad hoc at boot.

Required consequence:
1. catalog folders are the desired-state source
2. substrate rows are compiled from the catalog
3. `session-start` reads compiled state, not raw markdown

---

*Part of the {Org Name} AI Governance suite.*
