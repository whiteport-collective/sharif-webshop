---
name: skill-folder-scaffold
type: scaffold
description: What every skill folder must contain when Idun provisions it
---

# Skill Folder Scaffold

When Idun provisions a new skill, create this folder structure:

```
skills/{department}/{skill-name}/
├── skill.md              ← REQUIRED — definition and workflow
├── compliance.md         ← REQUIRED
├── agents/               ← Create if skill uses sub-agents
│   └── {sub-agent}.md
├── references/           ← Create if skill loads knowledge
│   └── {reference}.md
└── templates/            ← Create if skill produces output
    └── {template}.md
```

## skill.md

```markdown
---
name: {skill-name}
skill_slug: {stable-skill-slug}
domain: {domain}
agent: {primary agent}
owner: {department}
status: {active | pending_review | disabled}
phase: {phase number if applicable}
version: {12-char content hash, set by Idun on deploy}
---

# {Skill Title}

{One paragraph: what this skill does.}

## Process

{Steps — can be plain text for simple skills, WML for complex ones}

## References

- `references/{name}.md` — {what it provides}

## Sub-Agents

- `agents/{name}.md` — {what it does}

## Templates

- `templates/{name}.md` — {what it defines}
```

## compliance.md

Use the compliance template scaled to the org size.

## Version Control

Every skill, tool, and template is content-addressed. Idun computes a 12-character SHA256 hash of the skill content on every deploy and stores it in both the `version` frontmatter field and the Agent Space `agent_skills.version` column.

### How it works

1. **Deploy time:** Idun computes `SHA256(content).substring(0, 12)` for each skill and stores it in Agent Space alongside the skill content.
2. **Boot time:** `session-start` returns a version manifest — each skill's `skill_slug` + `version`. No content is sent at boot.
3. **Agent check:** The agent compares the manifest against its locally stored version list (in its sync skill file). Mismatches trigger a pull of updated content via the `get-skill` action.
4. **New skills:** Skills in the manifest that don't exist locally are flagged for installation.
5. **Removed skills:** Skills in the local list that are absent from the manifest are flagged for removal.

### Idun deploy manifest

After every deploy, Idun outputs a version snippet:

```
── Agent Space Versions ──────────────────────
saga-discovery      v:a1b2c3d4e5f6
idun-qualification  v:f6e5d4c3b2a1
email               v:aabbccddeeff
──────────────────────────────────────────────
```

Agents store this manifest locally. It is the single source of truth for "what version do I have?"

### Version hash computation

```
files = all files in skill directory, sorted by relative path
content = files.map(read).join("\n---\n")
version = SHA256(content).hex().substring(0, 12)
```

Deterministic. No manual version bumping. Content changes = new hash.

## Compilation note

`skill.md` should be compile-ready.

Minimum compile fields:
- `skill_slug`
- `agent`
- `owner`
- `status`
- `version` (set by Idun, not manually)
- references
- sub-agents
- templates
