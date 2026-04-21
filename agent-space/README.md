# Sharif Agent Space

Körkod och konfiguration för Sharifs AI-agenter — kund-agenten i storefronten och admin-agenten i backend-adminet.

## Struktur

```
agent-space/
  skills/        ← Elicitation- och beteende-skills, laddas just-in-time av agenten
  agents/        ← Agent-definitioner (yaml) — persona, default-modell, tool-scope
  README.md
```

## Skills

Skills är versionerade markdown-filer med YAML-frontmatter. De laddas av agent-route:n (i storefront + i `agent/` subprojektet) baserat på `sessionContext` — inte hårdkodade i system-prompten.

**Trigger-villkor** i frontmatter avgör när en skill laddas:

```yaml
trigger:
  view: results           # sessionContext.view
  products_min: 2         # products.length >= 2
```

Loadern slår ihop skillens body med bas-prompten och utökar tool-listan med skillens `requires_tools`.

## Agents

En `*.agent.yaml`-fil definierar en konkret agent — namn, persona, default-modell, och vilka tools + skills den har access till. Kund-agenten och admin-agenten är separata filer eftersom deras tool-scope är helt olika.

## Konventioner

- Filnamn: `kebab-case.skill.md`, `kebab-case.agent.yaml`
- Versioner: inkrementera `version:` i frontmatter vid breaking change
- Inga WDS-skills här — det är en separat domän (`_wds-e/skills/wds/`)
- Testbara: varje skill ska kunna köras mot en fejk-dialog som eval

## Ej ännu implementerat

Per WO-012 ska en skill-loader byggas i `storefront/src/app/api/agent/chat/route.ts` + `agent/src/customer-agent/index.ts`. Se [WO-012](../design-process/E-Development/WO-012-agent-ordering-api.md).
