---
name: codex-start
agent: codex
phase: implementation
version: 0.1
inputs:
  - current repo or project context
  - Agent Space boot response
  - local Codex state if present
outputs:
  - boot summary
  - synchronized Codex skill set
  - clear next task or context scan
---

## Intent

Boot Codex cleanly and consistently.

This skill is responsible for the start protocol, not for all implementation behavior. It ensures Codex starts from Agent Space truth, not from stale local state.

## Process

1. Load any local saved Codex state.
2. Call `session-start`.
3. Print the boot summary first.
4. Announce identity and current repo.
5. Print the resolved skill set and version metadata from Agent Space when available.
6. Check direct messages and work orders before free scanning.
7. Run Codex skill synchronization.
8. If `boot.next_task` exists, mirror it and begin immediately.
9. Otherwise, perform a repo/context scan.

## Rules

- `session-start` is mandatory.
- Agent Space is canonical.
- Boot does not invent tasks.
- Boot resolves whether local skills are stale before real work begins.
