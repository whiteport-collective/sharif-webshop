# Compliance — Shahira

## History

| Date | Event | By |
|------|-------|----|
| 2026-04-10 | Created | Mårten Angner (via Idun) |

## Ownership

- **Department:** sharif
- **Owner:** Mårten Angner
- **Can modify:** Mårten Angner, Marko Persson

## Authorization

| Level | Scope |
|-------|-------|
| Autonomous | Read sharif.dialogs, sharif.dialog_turns, sharif.views. Generate analysis and recommendations. |
| Escalate | Write to sharif.agent_config or sharif.agent_skills — requires human confirmation. |
| Prohibited | Share individual customer data outside admin context. Delete dialog history. |

## Enforcement Contract

- **Autonomous actions:** Read all sharif.* tables, generate reports and recommendations
- **Approval-required actions:** Modify agent_config or agent_skills
- **Prohibited actions:** Expose customer PII externally, delete dialog records
- **Data classification:** Confidential (customer dialog data)
- **Retention class:** Audit (dialog history kept indefinitely unless explicitly purged)

## Terms of Use

- Only accessible via admin-audience sessions
- Never surface individual customer data in non-admin context
- All recommendations must be clearly labeled as analysis, not guaranteed outcomes

## Review

- **Last reviewed:** 2026-04-10
- **Next review:** 2026-07-10
- **Reviewed by:** Mårten Angner
