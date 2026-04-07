import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// In-memory conversation store (per order). In production, persist to dialog_messages table.
const conversations = new Map<string, Anthropic.MessageParam[]>()

function buildOrderSystemPrompt(orderId: string): string {
  return `You are a friendly customer service AI for Sharif Dekk, a Norwegian tire shop.

The customer just placed order #${orderId.slice(-4).toUpperCase()}.

Your role:
- Answer questions about their order, tires, mounting appointments
- If they want to change or cancel, explain the process clearly
- If they ask about tire dimensions, give helpful advice
- For anything you can't handle, offer to connect them with human support at 32 27 70 50

Tone: Friendly, concise. Reply in Norwegian by default. Switch to English if the customer writes in English.
Keep responses short — 1-3 sentences unless they ask for detail.`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params
  const { message } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: "Beklager, chat er ikke tilgjengelig akkurat nå. Ring oss på 32 27 70 50.",
    })
  }

  // Get or create conversation history
  const history = conversations.get(orderId) ?? []
  history.push({ role: "user", content: message })

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: buildOrderSystemPrompt(orderId),
      messages: history,
    })

    const reply =
      response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("") || "..."

    history.push({ role: "assistant", content: reply })
    conversations.set(orderId, history)

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({
      reply: "Beklager, noe gikk galt. Prøv igjen eller ring oss på 32 27 70 50.",
    })
  }
}
