---
name: codex-wrap
agent: codex
phase: implementation
version: 0.1
inputs:
  - summary of work completed
  - decisions made
  - next steps
  - handoff targets if any
outputs:
  - persisted session state
  - captured wrap note in Agent Space
  - optional follow-up messages
---

## Intent

Close a Codex work session cleanly so the next session or next agent does not have to infer what happened.

## Process

1. Write local state.
2. Capture a structured wrap note to Agent Space.
3. Push relevant design/process files when the repo workflow expects it.
4. Dispatch follow-up messages if a handoff is required.
5. Mark the session complete with explicit next steps.

## Rules

- Wrap is not optional.
- A vague summary is not enough.
- Include what changed, what remains, and what blocked progress.
- If a handoff is needed, the target agent should not have to guess why.
