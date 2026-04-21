import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { storefrontAgentTools, UI_TOOL_NAMES } from "@lib/agent/tools"
import { buildSystemPrompt } from "@lib/agent/system-prompt"
import { executeDataTool } from "@lib/agent/data-tools"
import { loadSkillsForContext } from "@lib/agent/skill-loader"
import { searchTires } from "../../../actions/search-tires"
import { enrichProductsForAgent, type AgentProductPayload } from "@lib/agent/enrich-products"

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

type AgentFormState = {
  width: string | null
  profile: string | null
  rim: string | null
  qty: string | null
  season: string | null
}

function parseInitialDimension(dim: string | null | undefined): [string | null, string | null, string | null] {
  if (!dim) return [null, null, null]
  const m = dim.match(/^(\d+)\/(\d+)R(\d+)$/i)
  return m ? [m[1], m[2], m[3]] : [null, null, null]
}

function missingFields(state: AgentFormState): (keyof AgentFormState)[] {
  return (Object.keys(state) as (keyof AgentFormState)[]).filter((k) => !state[k])
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

  const skills = await loadSkillsForContext(sessionContext ?? {})
  const skillTools = new Set(skills.flatMap((s) => s.requires_tools))
  const activeTools = storefrontAgentTools.filter(
    (t) => !skillTools.size || skillTools.has(t.name) || !["highlightProducts", "clearHighlights"].includes(t.name)
  )

  const basePrompt = buildSystemPrompt(sessionContext ?? {}, settings ?? {})
  const systemPrompt =
    skills.length > 0
      ? [basePrompt, ...skills.map((s) => `---\n\n# Skill: ${s.name}\n\n${s.content}`)].join("\n\n")
      : basePrompt
  const countryCode = (sessionContext?.countryCode as string) || "no"

  const [initW, initP, initR] = parseInitialDimension(sessionContext?.dimension)
  const agentFormState: AgentFormState = {
    width: initW,
    profile: initP,
    rim: initR,
    qty: sessionContext?.qty ? String(sessionContext.qty) : null,
    season: sessionContext?.season ? String(sessionContext.season) : null,
  }

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
          tools: activeTools,
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
          if (toolUse.name === "setSearchField") {
            const { field, value } = toolUse.input as { field: keyof AgentFormState; value: string | number }
            const normalized = String(value ?? "").trim()
            if (!["width", "profile", "rim", "qty", "season"].includes(field)) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify({ ok: false, reason: `Unknown field: ${field}` }),
              })
              continue
            }
            agentFormState[field] = normalized || null
            send({
              type: "tool_call",
              name: "setSearchField",
              input: { field, value: normalized },
            })
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify({
                ok: true,
                field,
                value: normalized,
                allSet: missingFields(agentFormState).length === 0,
                missing: missingFields(agentFormState),
              }),
            })
          } else if (toolUse.name === "triggerSearch") {
            const missing = missingFields(agentFormState)
            if (missing.length > 0) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  ok: false,
                  reason: `Missing fields: ${missing.join(", ")}`,
                  recoverable: true,
                }),
              })
              continue
            }

            try {
              const result = await searchTires(
                countryCode,
                agentFormState.width as string,
                agentFormState.profile as string,
                agentFormState.rim as string
              )
              const products: AgentProductPayload[] = enrichProductsForAgent(result.products)
              const dimension = `${agentFormState.width}/${agentFormState.profile}R${agentFormState.rim}`

              send({ type: "tool_call", name: "triggerSearch", input: {} })

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  ok: true,
                  dimension,
                  qty: Number(agentFormState.qty),
                  season: agentFormState.season,
                  productCount: products.length,
                  products,
                }),
              })
            } catch (err) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  ok: false,
                  reason: err instanceof Error ? err.message : "search failed",
                  recoverable: true,
                }),
              })
            }
          } else if (UI_TOOL_NAMES.has(toolUse.name)) {
            // Fire-and-forget UI dispatch for the remaining browser-side tools.
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
