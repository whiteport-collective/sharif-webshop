---
name: codex-handoff
agent: codex
phase: implementation
version: 0.1
inputs:
  - target agent
  - reason for handoff
  - current state
  - exact next step
outputs:
  - Agent Space message or work order
  - handoff summary in wrap state
---

## Intent

Hand work to another WDS-E agent without ambiguity.

## Process

1. Name the target agent explicitly.
2. State why the handoff belongs with them.
3. Describe the current completed state.
4. State the exact next step.
5. Send the handoff through Agent Space.
6. Include the same handoff in the wrap summary.

## Rules

- Do not hand off a mess.
- Do not hand off without an explicit next step.
- Do not hand off due to laziness; hand off due to better fit.
- If the handoff is speculative, say so directly.
