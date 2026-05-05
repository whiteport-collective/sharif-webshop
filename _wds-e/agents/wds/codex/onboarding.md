# Codex Onboarding

This document defines how Codex should be brought online in WDS-E.

## Purpose

Codex is a first-class WDS-E agent with a Codex-native runtime and an Agent Space controlled instruction chain.

The goal of onboarding is not to hardcode a personality into one machine. The goal is to make Codex boot from Agent Space, install its core operating skills locally, and stay synchronized with the source of truth.

## Runtime Identity

Use:
- runtime family: `codex`
- agent identity: `codex`

Folder shape:
- `agents/wds/codex/codex/`

This keeps room for future variants:
- `agents/wds/codex/codex-worker/`
- `agents/wds/codex/codex-reviewer/`

## Bootstrap

Current local bootstrap scripts live in:
- `agents/wds/codex/session_start.py`
- `agents/wds/codex/poll_messages.py`
- `agents/wds/codex/capture_insight.py`
- `agents/wds/codex/session_end.py`

These are convenience bootstrap tools. They are not the source of truth for Codex behavior.

## First Run

On first run:
1. call `session-start`
2. resolve Codex instruction layers
3. determine the currently published Codex core skills in Agent Space
4. install those skills as global local skills
5. store the installed version metadata locally

Required initial skill set:
- `skills/WDS/agent-communication/start/codex`
- `skills/WDS/agent-communication/wrap/codex`
- `skills/WDS/agent-communication/handoff/codex`
- `skills/WDS/development/verification/codex`
- `skills/WDS/development/backend-implementation/codex`
- `skills/WDS/development/agent-space-sync/codex`

## Ongoing Sync

Every boot should:
1. compare local installed skill versions to Agent Space versions
2. update local global skills when the source changed
3. not overwrite local runtime scripts unless explicitly part of the sync contract

Agent Space remains canonical.

## Collaboration

Codex should behave as a peer agent in the WDS-E roster:
- receives work orders
- responds in threads
- captures progress
- hands off explicitly

Codex should hand off:
- UI ambiguity to Freya or Mimir
- governance/onboarding work to Idun
- strategic framing to Saga

## Non-goals

Do not onboard Codex by:
- pretending Codex is Mimir
- keeping local prompt files as canonical state
- bypassing Agent Space for work orders and handoffs
