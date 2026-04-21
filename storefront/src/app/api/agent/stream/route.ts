import { NextRequest, NextResponse } from "next/server"
import {
  registerSession,
  unregisterSession,
  touchSession,
} from "@lib/agent/command-bus"
import { writeFile } from "fs/promises"
import path from "path"

const IS_DEV =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_HEADLESS_AGENT === "true"

export async function GET(req: NextRequest) {
  if (!IS_DEV) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const sessionId = req.nextUrl.searchParams.get("sessionId")
  if (!sessionId)
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      registerSession(sessionId, controller)

      // Write .drive-session file so drive.mjs picks it up automatically
      const driveSessionPath = path.join(process.cwd(), "..", ".drive-session")
      writeFile(driveSessionPath, sessionId, "utf8").catch(() => {})

      // Initial connected event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", sessionId })}\n\n`
        )
      )

      // Heartbeat every 25s to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          touchSession(sessionId)
          controller.enqueue(encoder.encode(`:heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25_000)

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        unregisterSession(sessionId)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Session-Id": sessionId,
    },
  })
}
