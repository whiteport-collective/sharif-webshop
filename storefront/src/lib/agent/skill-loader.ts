import fs from "fs/promises"
import path from "path"

type SkillFrontmatter = {
  name: string
  version?: string | number
  trigger?: {
    view?: string
    step?: string
    season?: string
    products_min?: number
  }
  requires_tools?: string[]
}

type SessionLike = {
  view?: string
  step?: string | null
  checkoutStep?: string | null
  season?: string
  searchForm?: {
    season?: string | null
  }
  visibleProductIds?: string[]
}

function parseFrontmatter(raw: string): { meta: SkillFrontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { meta: { name: "unknown" }, body: raw }

  const [, yamlBlock, body] = match
  const meta: SkillFrontmatter = { name: "unknown" }

  let currentKey: string | null = null
  let inTrigger = false
  let inTools = false

  for (const rawLine of yamlBlock.split(/\r?\n/)) {
    const line = rawLine
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    if (line.startsWith("  - ") && inTools) {
      meta.requires_tools = [...(meta.requires_tools ?? []), trimmed.replace(/^- /, "")]
      continue
    }

    if (line.startsWith("  ") && inTrigger) {
      if (!meta.trigger) meta.trigger = {}
      const colonIdx = trimmed.indexOf(":")
      if (colonIdx === -1) continue
      const k = trimmed.slice(0, colonIdx).trim()
      const v = trimmed.slice(colonIdx + 1).trim()
      if (k === "view") meta.trigger.view = v
      else if (k === "step") meta.trigger.step = v
      else if (k === "season") meta.trigger.season = v
      else if (k === "products_min") meta.trigger.products_min = Number(v)
      continue
    }

    inTrigger = false
    inTools = false

    const colonIdx = trimmed.indexOf(":")
    if (colonIdx === -1) continue
    const k = trimmed.slice(0, colonIdx).trim()
    const v = trimmed.slice(colonIdx + 1).trim()

    if (k === "name") meta.name = v
    else if (k === "version") meta.version = v
    else if (k === "trigger") { meta.trigger = {}; inTrigger = true; currentKey = "trigger" }
    else if (k === "requires_tools") { meta.requires_tools = []; inTools = true; currentKey = "requires_tools" }
    else currentKey = k
  }

  return { meta, body: body.trim() }
}

function matchesTrigger(trigger: SkillFrontmatter["trigger"], ctx: SessionLike): boolean {
  if (!trigger) return true

  if (trigger.view && trigger.view !== ctx.view) return false

  const step = ctx.checkoutStep ?? ctx.step ?? null
  if (trigger.step && trigger.step !== step) return false

  const season = ctx.searchForm?.season ?? ctx.season ?? ""
  if (trigger.season && !season.includes(trigger.season)) return false

  if (trigger.products_min != null) {
    const count = ctx.visibleProductIds?.length ?? 0
    if (count < trigger.products_min) return false
  }

  return true
}

export type LoadedSkill = {
  name: string
  content: string
  requires_tools: string[]
}

const SKILLS_DIR = path.join(process.cwd(), "..", "agent-space", "skills")

export async function loadSkillsForContext(ctx: SessionLike): Promise<LoadedSkill[]> {
  let files: string[]
  try {
    files = await fs.readdir(SKILLS_DIR)
  } catch {
    return []
  }

  const skills: LoadedSkill[] = []

  for (const file of files.filter((f) => f.endsWith(".skill.md"))) {
    try {
      const raw = await fs.readFile(path.join(SKILLS_DIR, file), "utf-8")
      const { meta, body } = parseFrontmatter(raw)
      if (matchesTrigger(meta.trigger, ctx)) {
        skills.push({
          name: meta.name,
          content: body,
          requires_tools: meta.requires_tools ?? [],
        })
      }
    } catch {
      // Skip unreadable files
    }
  }

  return skills
}
