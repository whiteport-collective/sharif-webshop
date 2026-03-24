# Visual Export — WDS Skill

**Invocation:** `/export` or `/visual-export`
**Icon:** :frame_with_picture:
**Role:** Convert design artifacts to embeddable images
**Used by:** Freya (Phase 3-4), any agent needing visual output

---

## Purpose

Design artifacts live in source formats (Excalidraw, Mermaid, .pen) that aren't viewable inline in markdown specs, GitHub PRs, or by non-technical stakeholders. This skill converts them to standard image formats (PNG/JPG) so wireframes and diagrams can be embedded in page specifications and reviewed without special tooling.

---

## Supported Formats

| Format | Status | Tool | Input | Output |
|--------|--------|------|-------|--------|
| **Excalidraw** | :white_check_mark: Ready | `scripts/excalidraw-to-image.py` | `.excalidraw` JSON | PNG (default) / JPG |
| **Mermaid** | :construction: Planned | TBD (mmdc CLI or API) | `.mmd` / fenced blocks | PNG / SVG |
| **.pen** | :construction: Planned | TBD | `.pen` files | PNG / JPG |

---

## Usage

### Single file

```bash
python scripts/excalidraw-to-image.py <input.excalidraw> [output.png]
```

### Batch (all wireframes in a scenario folder)

```bash
python scripts/excalidraw-to-image.py --batch design-process/C-UX-Scenarios/
```

### With spec update (render + update markdown image reference)

```bash
python scripts/excalidraw-to-image.py input.excalidraw --update-spec spec.md
```

### Options

| Flag | Default | Purpose |
|------|---------|---------|
| `--format` | `png` | Output format: `png` or `jpg` |
| `--scale` | `1.0` | Scale factor for higher resolution |
| `--padding` | `40` | Padding around content (px) |
| `--update-spec FILE` | — | Update image ref in markdown spec after export |
| `--batch DIR` | — | Recursively convert all `.excalidraw` in directory |

---

## When to Use

### Automatic (agent should run without asking)
- After creating or modifying an Excalidraw wireframe
- Before marking a page as `wireframed` in the Design Loop
- When preparing specs for handoff to implementation agents (Codex)

### On request
- User says `/export` — run batch on current scenario folder
- User says `/export <file>` — convert specific file
- Before creating a PR that includes design artifacts

---

## Integration with Page Specs

Page specification files reference wireframe images like:

```markdown
![Wireframe](Sketches/1.2-nyheter-wireframe.png)
```

The `--update-spec` flag ensures the markdown points to the generated file. The convention is:

```
design-process/C-UX-Scenarios/{scenario}/{page}/Sketches/{page}-wireframe.excalidraw  (source)
design-process/C-UX-Scenarios/{scenario}/{page}/Sketches/{page}-wireframe.png          (rendered)
```

---

## Rendering Details

The Excalidraw renderer handles these element types:
- **rectangle** — with fill, stroke, rounded corners, opacity
- **text** — with font family mapping, alignment, multiline
- **line** — with multipoint paths, stroke width, opacity
- **ellipse** — with fill and stroke

Font mapping (Windows):
- Excalidraw font 1 (Virgil/hand-drawn) → Segoe UI
- Excalidraw font 2 (Helvetica) → Arial
- Excalidraw font 3 (monospace) → Consolas

Background color is read from `appState.viewBackgroundColor`.

---

## Future: Mermaid Support

Mermaid diagrams appear in:
- `B-Trigger-Map/00-trigger-map.md` (flow diagrams)
- Architecture docs
- Any fenced ```mermaid block

Planned approach: extract mermaid blocks from markdown, render via `mmdc` (Mermaid CLI) or HTTP API, embed as images.

---

## Future: .pen Support

`.pen` files from handwriting/sketching apps. Planned approach: parse stroke data, render via Pillow or Cairo.

---

## Dependencies

- Python 3.10+
- Pillow (`pip install pillow`)
- System fonts: Arial, Segoe UI, Consolas (standard on Windows)
