import { NextRequest, NextResponse } from "next/server"
import { resolveCommand } from "@lib/agent/command-bus"

const IS_DEV =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_HEADLESS_AGENT === "true"

export async function POST(req: NextRequest) {
  if (!IS_DEV) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const { commandId, result } = await req.json()

  if (!commandId)
    return NextResponse.json({ error: "commandId required" }, { status: 400 })

  const resolved = resolveCommand(commandId, result)

  if (!resolved)
    return NextResponse.json(
      { error: "Command not found or already resolved" },
      { status: 404 }
    )

  return NextResponse.json({ ok: true })
}
