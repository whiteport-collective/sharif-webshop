import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { storefrontAgentTools, UI_TOOL_NAMES } from "@lib/agent/tools"
import { buildSystemPrompt } from "@lib/agent/system-prompt"
import { executeDataTool } from "@lib/agent/data-tools"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const BACKEND_API_KEY = process.env.MEDUSA_BACKEND_API_KEY ?? ""

async function getSettings() {
  try {
    const res = await fetch(`${BACKEND}/admin/sharif-settings`, {
      headers: { Authorization: `Bearer ${BACKEND_API_KEY}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const { settings } = await res.json()
    return settings
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { messages, sessionContext } = await req.json()

  if (!messages?.length) {
    return NextResponse.json({ error: "messages required" }, { status: 400 })
  }

  const settings = await getSettings()

  if (settings?.agent_enabled === false) {
    return new NextResponse("Agent er deaktivert", { status: 503 })
  }

  const systemPrompt = buildSystemPrompt(sessionContext ?? {}, settings ?? {})

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const conversationMessages: Anthropic.MessageParam[] = messages.map(
        (m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })
      )

      let continueLoop = true

      while (continueLoop) {
        const claudeStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemPrompt,
          tools: storefrontAgentTools,
          messages: conversationMessages,
        })

        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ type: "text", text: event.delta.text })
          }
        }

        const finalMessage = await claudeStream.finalMessage()

        if (finalMessage.stop_reason === "end_turn") {
          continueLoop = false
          send({ type: "done" })
          break
        }

        const toolUseBlocks = finalMessage.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        )

        if (!toolUseBlocks.length) {
          continueLoop = false
          send({ type: "done" })
          break
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolUse of toolUseBlocks) {
          if (UI_TOOL_NAMES.has(toolUse.name)) {
            // Emit to browser — will be dispatched via AgentToolContext
            send({
              type: "tool_call",
              name: toolUse.name,
              input: toolUse.input,
            })
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify({ ok: true }),
            })
          } else if (toolUse.name === "escalateToAdmin") {
            // Call escalate endpoint
            try {
              const { email, message } = toolUse.input as { email?: string; message: string }
              const escalateRes = await fetch(
                `${req.nextUrl.origin}/api/agent/escalate`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, message }),
                }
              )
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify(await escalateRes.json()),
              })
            } catch {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify({ ok: false }),
              })
            }
          } else {
            const result = await executeDataTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>
            )
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            })
          }
        }

        conversationMessages.push({ role: "assistant", content: finalMessage.content })
        conversationMessages.push({ role: "user", content: toolResults })
      }

      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
