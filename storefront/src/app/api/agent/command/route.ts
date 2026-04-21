import { NextRequest, NextResponse } from "next/server"
import { invokeCommand } from "@lib/agent/command-bus"
import { randomUUID } from "crypto"

const IS_DEV =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_HEADLESS_AGENT === "true"

export async function POST(req: NextRequest) {
  if (!IS_DEV) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const { sessionId, tool, args } = await req.json()

  if (!sessionId || !tool)
    return NextResponse.json(
      { error: "sessionId and tool are required" },
      { status: 400 }
    )

  const commandId = randomUUID()

  try {
    const result = await invokeCommand(
      sessionId,
      commandId,
      tool,
      args ?? {}
    )
    return NextResponse.json({ ok: true, commandId, result })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        commandId,
        error: err instanceof Error ? err.message : "unknown error",
      },
      { status: err instanceof Error && err.message.includes("not found") ? 404 : 408 }
    )
  }
}
