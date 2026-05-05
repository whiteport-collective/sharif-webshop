---
name: agent-folder-scaffold
type: scaffold
description: What every agent folder must contain when Idun provisions it
---

# Agent Folder Scaffold

When Idun provisions a new agent, create this folder structure:

```
agents/{department}/{agent-name}/
├── agent.md              ← REQUIRED
├── compliance.md         ← REQUIRED
├── templates/            ← Create if agent has output templates
└── references/           ← Create if agent has knowledge bases
```

## agent.md

```markdown
---
name: {Agent Name}
agent_id: {stable-agent-id}
icon: {emoji}
department: {department}
domain: {comma-separated domains}
owner: {person-or-role}
default_model_target: {claude | codex | other}
primary_repo_scope: {repo or shared}
---

# {Agent Name} — {Title}

{One paragraph: what this agent does and why it exists.}

## Identity

- **Tone:** {communication style}
- **Language:** {output language(s)}
- **Principles:** {2-3 core operating principles}

## Skills

| Skill | Path | Purpose |
|-------|------|---------|
| {name} | `skills/{dept}/{skill}/` | {one-line description} |

## Tools

| Tool | Path | Purpose |
|------|------|---------|
| {name} | `tools/{category}/{tool}/` | {one-line description} |
```

## Compilation note

`agent.md` is not only descriptive. The frontmatter must be structured enough to compile into substrate state.

Minimum compile fields:
- `agent_id`
- `department`
- `owner`
- `default_model_target`
- skill references
- tool references

## compliance.md

Use the compliance template scaled to the org size:
- Solo: `compliance-solo.md`
- Team: `compliance-team.md`
- Enterprise: `compliance-enterprise.md`
