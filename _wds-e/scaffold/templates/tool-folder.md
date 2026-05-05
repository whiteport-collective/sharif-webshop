---
name: tool-folder-scaffold
type: scaffold
description: What every tool folder must contain when Idun provisions it
---

# Tool Folder Scaffold

When Idun provisions a new tool, create this folder structure:

```
tools/{category}/{tool-name}/
├── tool.md               ← REQUIRED — capabilities and connection
├── compliance.md         ← REQUIRED — vendor terms, data handling
└── templates/            ← Create if tool has API references or examples
    └── {reference}.md
```

## tool.md

```markdown
---
name: {tool-name}
tool_slug: {stable-tool-slug}
domain: {domain}
type: {api | oauth | local | service}
connection_ref: {secret or config reference}
approval_mode: {autonomous | approval-required | human-only}
---

# {Tool Name}

{One paragraph: what this tool does.}

## Connection

{How to connect — API URL, auth method, credentials location}

## Capabilities

{What the tool can do — bullet list}

## Limitations

{What the tool cannot do, or what requires human action}
```

## compliance.md

Must include vendor section for external tools:

```markdown
## Vendor

- **Vendor:** {company name}
- **Data location:** {where data is processed/stored}
- **Training on our data:** {yes/no/per terms}
- **GDPR status:** {assessment}

## Costs

- **Paid by:** {person}
- **Logged in:** {finance file}
```

## Compilation note

`tool.md` should be structured enough for the substrate to know:
- how the tool is identified
- where connection/config comes from
- whether it may run autonomously
