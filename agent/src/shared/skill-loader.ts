import type Anthropic from "@anthropic-ai/sdk"
import { getSharifSchema } from "./db.js"
import type {
  AgentAudience,
  AgentConfigRow,
  AgentSkillRow,
  AgentSnapshot,
  DialogInsert,
  DialogRow,
  DialogTurnInsert,
  DialogTurnRow,
} from "./types.js"

export async function loadAgentConfig(audience: AgentAudience) {
  const supabase = getSharifSchema()
  const query = await supabase
    .from("agent_config")
    .select("*")
    .eq("audience", audience)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (query.error) {
    throw new Error(`Failed to load ${audience} agent config: ${query.error.message}`)
  }

  if (!query.data) {
    throw new Error(`No active agent_config row found for audience "${audience}"`)
  }

  return query.data satisfies AgentConfigRow
}

export async function loadActiveSkills(audience: AgentAudience) {
  const supabase = getSharifSchema()
  const query = await supabase
    .from("agent_skills")
    .select("*")
    .eq("active", true)
    .in("audience", [audience, "both"])
    .order("name", { ascending: true })
    .order("version", { ascending: true })

  if (query.error) {
    throw new Error(`Failed to load ${audience} agent skills: ${query.error.message}`)
  }

  return (query.data ?? []) satisfies AgentSkillRow[]
}

export function buildAgentSnapshot(
  audience: AgentAudience,
  config: AgentConfigRow,
  skills: AgentSkillRow[]
): AgentSnapshot {
  return {
    audience,
    config: {
      id: config.id,
      name: config.name,
      updated_at: config.updated_at,
    },
    skills: skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      version: skill.version,
      updated_at: skill.updated_at,
    })),
  }
}

export function buildSystemPrompt(audience: AgentAudience, config: AgentConfigRow, skills: AgentSkillRow[]) {
  const sections = [
    `Audience: ${audience}`,
    `Agent name: ${config.name}`,
    config.persona?.trim() ? `Persona:\n${config.persona.trim()}` : "",
    `Core instructions:\n${config.system_prompt.trim()}`,
  ]

  if (skills.length) {
    sections.push(
      `Active skills:\n${skills
        .map(
          (skill) =>
            `## ${skill.name} v${skill.version ?? 1}\n${skill.description?.trim() ? `${skill.description.trim()}\n\n` : ""}${skill.content.trim()}`
        )
        .join("\n\n")}`
    )
  }

  sections.push(
    audience === "admin"
      ? "You are speaking to Sharif staff. Be concise, operational, and explicit about uncertainty."
      : "You are speaking to a Sharif customer. Be clear, polite, and practical. Do not invent order facts."
  )

  return sections.filter(Boolean).join("\n\n")
}

export async function getDialog(dialogId: string, audience: AgentAudience) {
  const supabase = getSharifSchema()
  const query = await supabase
    .from("dialogs")
    .select("*")
    .eq("id", dialogId)
    .eq("audience", audience)
    .maybeSingle()

  if (query.error) {
    throw new Error(`Failed to load dialog ${dialogId}: ${query.error.message}`)
  }

  return (query.data ?? null) satisfies DialogRow | null
}

export async function createDialog(dialog: DialogInsert) {
  const supabase = getSharifSchema()
  const query = await supabase.from("dialogs").insert(dialog).select("*").single()

  if (query.error) {
    throw new Error(`Failed to create dialog: ${query.error.message}`)
  }

  return query.data satisfies DialogRow
}

export async function listDialogTurns(dialogId: string) {
  const supabase = getSharifSchema()
  const query = await supabase
    .from("dialog_turns")
    .select("*")
    .eq("dialog_id", dialogId)
    .order("created_at", { ascending: true })

  if (query.error) {
    throw new Error(`Failed to load turns for dialog ${dialogId}: ${query.error.message}`)
  }

  return (query.data ?? []) satisfies DialogTurnRow[]
}

export async function appendDialogTurn(turn: DialogTurnInsert) {
  const supabase = getSharifSchema()
  const query = await supabase.from("dialog_turns").insert(turn).select("*").single()

  if (query.error) {
    throw new Error(`Failed to append dialog turn: ${query.error.message}`)
  }

  return query.data satisfies DialogTurnRow
}

export function toAnthropicMessages(turns: DialogTurnRow[]): Anthropic.MessageParam[] {
  return turns
    .filter((turn): turn is DialogTurnRow & { role: "user" | "assistant" } => turn.role === "user" || turn.role === "assistant")
    .map((turn) => ({
      role: turn.role,
      content: turn.content ?? "",
    }))
}
