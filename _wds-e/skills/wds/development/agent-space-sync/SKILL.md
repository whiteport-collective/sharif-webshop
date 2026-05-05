---
name: codex-agent-space-sync
agent: codex
phase: implementation
version: 0.1
inputs:
  - Codex instruction chain from Agent Space
  - published Codex core skill metadata
  - local installed skill versions
outputs:
  - synchronized local global Codex skills
  - version record for future boots
---

## Intent

Keep local Codex skills aligned with Agent Space without treating local files as the source of truth.

## Process

1. Read the currently published Codex skills from Agent Space.
2. Read local installed versions.
3. Compare versions or hashes.
4. Install or update only the changed skills locally.
5. Record the installed version metadata.

Core skill set:
- `codex-start`
- `codex-wrap`
- `codex-handoff`
- `codex-verification`
- `codex-agent-space-sync`
- `codex-backend-implementation`

## Rules

- Agent Space is canonical.
- Local install is cache.
- Sync on first run is mandatory.
- Sync on later runs happens when versions changed.
- Do not silently invent local-only Codex behavior that diverges from Agent Space.
