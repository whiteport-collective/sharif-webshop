import Anthropic from "@anthropic-ai/sdk"
import { DEFAULT_MODEL } from "./db.js"
import {
  appendDialogTurn,
  buildAgentSnapshot,
  buildSystemPrompt,
  createDialog,
  getDialog,
  listDialogTurns,
  loadActiveSkills,
  loadAgentConfig,
  toAnthropicMessages,
} from "./skill-loader.js"
import type { AgentAudience, DialogRow, JsonObject } from "./types.js"

export type AgentRequestBody = {
  dialog_id?: string
  message: string
  user_id?: string
  staff_id?: string
}

export type PreparedConversation = {
  dialog: DialogRow
  anthropic: Anthropic
  model: string
  systemPrompt: string
  messages: Anthropic.MessageParam[]
  assistantSnapshot: JsonObject
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function prepareConversation(
  audience: AgentAudience,
  body: AgentRequestBody
): Promise<PreparedConversation> {
  const identifier = audience === "admin" ? body.staff_id?.trim() : body.user_id?.trim()

  if (!body.message?.trim()) {
    throw new Error("message is required")
  }

  if (audience === "admin" && !identifier) {
    throw new Error("staff_id is required for admin conversations")
  }

  const [config, skills] = await Promise.all([loadAgentConfig(audience), loadActiveSkills(audience)])
  const snapshot = buildAgentSnapshot(audience, config, skills)
  const dialogId = body.dialog_id?.trim()

  const dialog = dialogId
    ? await (async () => {
        const existingDialog = await getDialog(dialogId, audience)
        if (!existingDialog) {
          throw new Error(`Dialog ${body.dialog_id} was not found for audience "${audience}"`)
        }

        return existingDialog
      })()
    : await createDialog({
        audience,
        user_id: identifier ?? null,
        channel: "api",
        agent_config_id: config.id,
        metadata: {
          created_by: "agent-server",
          identifier: identifier ?? null,
        },
      })

  await appendDialogTurn({
    dialog_id: dialog.id,
    role: "user",
    content: body.message.trim(),
    agent_snapshot: snapshot,
  })

  const turns = await listDialogTurns(dialog.id)
  const messages = toAnthropicMessages(turns)
  const systemPrompt = buildSystemPrompt(audience, config, skills)

  return {
    dialog,
    anthropic,
    model: DEFAULT_MODEL,
    systemPrompt,
    messages,
    assistantSnapshot: snapshot,
  }
}

export async function persistAssistantTurn(
  dialogId: string,
  content: string,
  assistantSnapshot: JsonObject
) {
  await appendDialogTurn({
    dialog_id: dialogId,
    role: "assistant",
    content,
    agent_snapshot: assistantSnapshot,
  })
}
