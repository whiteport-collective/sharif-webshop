// In-memory command bus for headless agent control (dev-only).
// Uses globalThis so state survives hot-reloads in Next.js dev server.

const COMMAND_TIMEOUT_MS = 10_000

type SessionEntry = {
  controller: ReadableStreamDefaultController<Uint8Array>
  connectedAt: number
  lastSeen: number
}

type PendingCommand = {
  resolve: (result: unknown) => void
  reject: (err: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

declare global {
  // eslint-disable-next-line no-var
  var __agentSessions: Map<string, SessionEntry> | undefined
  // eslint-disable-next-line no-var
  var __agentPendingCommands: Map<string, PendingCommand> | undefined
}

function getSessions(): Map<string, SessionEntry> {
  globalThis.__agentSessions ??= new Map()
  return globalThis.__agentSessions
}

function getPending(): Map<string, PendingCommand> {
  globalThis.__agentPendingCommands ??= new Map()
  return globalThis.__agentPendingCommands
}

const encoder = new TextEncoder()

function sseEvent(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

export function registerSession(
  sessionId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  getSessions().set(sessionId, {
    controller,
    connectedAt: Date.now(),
    lastSeen: Date.now(),
  })
}

export function unregisterSession(sessionId: string): void {
  getSessions().delete(sessionId)
}

export function touchSession(sessionId: string): void {
  const s = getSessions().get(sessionId)
  if (s) s.lastSeen = Date.now()
}

export function listSessions(): Array<{
  sessionId: string
  connectedAt: number
  lastSeen: number
}> {
  return Array.from(getSessions().entries()).map(([sessionId, s]) => ({
    sessionId,
    connectedAt: s.connectedAt,
    lastSeen: s.lastSeen,
  }))
}

export function invokeCommand(
  sessionId: string,
  commandId: string,
  tool: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const session = getSessions().get(sessionId)
  if (!session) return Promise.reject(new Error(`Session not found: ${sessionId}`))

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      getPending().delete(commandId)
      reject(new Error(`Command timed out after ${COMMAND_TIMEOUT_MS}ms`))
    }, COMMAND_TIMEOUT_MS)

    getPending().set(commandId, { resolve, reject, timeoutId })

    try {
      session.controller.enqueue(
        sseEvent({ type: "tool-invoke", commandId, tool, args })
      )
    } catch (err) {
      clearTimeout(timeoutId)
      getPending().delete(commandId)
      reject(err)
    }
  })
}

export function resolveCommand(commandId: string, result: unknown): boolean {
  const pending = getPending().get(commandId)
  if (!pending) return false
  clearTimeout(pending.timeoutId)
  getPending().delete(commandId)
  pending.resolve(result)
  return true
}
