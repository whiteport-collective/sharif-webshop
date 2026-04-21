import { NextResponse } from "next/server"
import { listSessions } from "@lib/agent/command-bus"

const IS_DEV =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_HEADLESS_AGENT === "true"

export async function GET() {
  if (!IS_DEV) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json(listSessions())
}
