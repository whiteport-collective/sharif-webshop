import type { ServerResponse } from "node:http"
import { startSse, writeSse } from "../shared/http.js"
import { persistAssistantTurn, prepareConversation, type AgentRequestBody } from "../shared/runtime.js"

export async function handleCustomerAgent(body: AgentRequestBody, res: ServerResponse) {
  const prepared = await prepareConversation("customer", body)

  startSse(res)
  writeSse(res, { type: "ready", dialog_id: prepared.dialog.id })

  try {
    const stream = await prepared.anthropic.messages.stream({
      model: prepared.model,
      max_tokens: 1024,
      system: prepared.systemPrompt,
      messages: prepared.messages,
    })

    let assistantText = ""

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        assistantText += event.delta.text
        writeSse(res, { type: "text", text: event.delta.text })
      }
    }

    const finalMessage = await stream.finalMessage()
    const finalText = finalMessage.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim()

    await persistAssistantTurn(prepared.dialog.id, finalText || assistantText, prepared.assistantSnapshot)
    writeSse(res, { type: "done", dialog_id: prepared.dialog.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown customer agent error"
    writeSse(res, { type: "error", message, dialog_id: prepared.dialog.id })
  } finally {
    res.end()
  }
}
