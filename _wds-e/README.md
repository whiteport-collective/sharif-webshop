# WDS-E — Sharif Webshop

Lokal kopia av WDS-E standarddefinitioner + Sharif-specifika agenter och skills.

**Resiliensprincip:** Allt som agenter behöver för att fungera finns lokalt i detta repo.
Om WDS-E upstream-repot är okontaktbart lever systemet vidare härifrån.

## Uppdatering

Synkas manuellt från WDS-EC compiled-mappen:
```
Source: whiteport-design-studio-enterprise-codebase/compiled/claude-sonnet-4-6/
Target: _wds-e/agents/wds/
```

---

## Struktur

```
_wds-e/
├── agents/
│   ├── wds/          ← WDS-standard agenter (synkade från WDS-EC)
│   │   ├── idun/     ← Setup & systemadmin
│   │   ├── saga/     ← Strategianalys
│   │   ├── freya/    ← UX-design
│   │   ├── mimir/    ← Implementation
│   │   └── codex/    ← Kodgranskning
│   └── sharif/       ← Sharif-specifika agenter
│       └── shahira/  ← Senior E-commerce Manager
│
├── skills/
│   ├── wds/          ← WDS-standard skills (synkade från WDS-EC)
│   │   ├── agent-communication/
│   │   │   ├── handoff/
│   │   │   ├── start/
│   │   │   └── wrap/
│   │   └── development/
│   │       └── agent-space-sync/
│   └── sharif/       ← Sharif-specifika skills
│       ├── customer-behavior/
│       ├── sales-optimization/
│       ├── marketing/
│       ├── logistics/
│       └── dialog-history/
│
├── tools/
│   └── sharif/
│       └── supabase/  ← sharif.* schema access
│
└── scaffold/
    └── templates/     ← WDS-E scaffold-mallar (synkade från WDS-EC)
```

## Agent Space

- **Projekt:** acwnjsdtfwoflndvzabq (Whiteport Agent Space, sharif org)
- **Schema:** `sharif.*` (isolerat, migrerbart till eget projekt)

## Agenter

| Agent | Typ | Syfte |
|-------|-----|-------|
| Idun | WDS-standard | Setup, systemadmin, onboarding |
| Shahira | Sharif-specifik | E-commerce manager, analytics |
| Codex | WDS-standard | Implementation |
| Saga | WDS-standard | Strategi (vid behov) |
| Freya | WDS-standard | UX-design (vid behov) |
| Mimir | WDS-standard | Implementation-review (vid behov) |
