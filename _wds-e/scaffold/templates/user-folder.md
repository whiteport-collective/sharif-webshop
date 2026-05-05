---
name: user-folder-scaffold
type: scaffold
description: What every user folder must contain when Idun provisions a person into the org
---

# User Folder Scaffold

When Idun provisions a user, create this folder structure:

```
users/{person}/
└── user.md               ← REQUIRED
```

## user.md

```markdown
---
user_key: {stable-user-key}
display_name: {Full Name}
email: {email}
github: {username}
role: {role}
department: {department}
access_level: {solo | org | client | project | repo}
preferred_language: {language}
default_agents:
  - {agent-id}
projects:
  - {project}
repos:
  - {repo}
---

# {Full Name}

**Role:** {role}  
**Department:** {department}  
**Technical level:** {assessment}

## Agents

| Agent | Access | Purpose |
|-------|--------|---------|
| {agent-id} | {access} | {purpose} |

## Skill Access

- `{department}/*` — {reason}
- `{cross-functional-skill}` — {reason}

## Notes

- {preferences}
- {constraints}
```

## Why these fields exist

These fields are not only for human reading. They give the substrate enough structure to compile:
- user identity
- role
- access level
- default agents
- project and repo scope
- language preference

Without this file, user compilation remains implicit and `session-start` cannot reliably boot a person-specific instruction set.
