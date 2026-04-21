#!/usr/bin/env node
// drive.mjs — headless agent tool driver
//
// Usage:
//   node scripts/drive.mjs <tool> [arg1] [arg2] ...
//   node scripts/drive.mjs setSearchField width 205
//   node scripts/drive.mjs setSearchField profile 55
//   node scripts/drive.mjs setSearchField rim 16
//   node scripts/drive.mjs setSearchField qty 4
//   node scripts/drive.mjs setSearchField season sommer
//   node scripts/drive.mjs triggerSearch
//   node scripts/drive.mjs selectTireForCheckout <productId>
//   node scripts/drive.mjs highlightProducts <id1> [id2] ...
//   node scripts/drive.mjs sessions    — list active browser sessions
//
// Session ID is read from .drive-session (written automatically when browser connects).
// Override with: DRIVE_SESSION=<id> node scripts/drive.mjs ...
// Override base URL with: DRIVE_URL=http://localhost:3001

import { readFile } from "fs/promises"
import { resolve } from "path"

const BASE_URL = process.env.DRIVE_URL ?? "http://localhost:3001"
const SESSION_FILE = resolve(process.cwd(), ".drive-session")

async function getSessionId() {
  if (process.env.DRIVE_SESSION) return process.env.DRIVE_SESSION
  try {
    return (await readFile(SESSION_FILE, "utf8")).trim()
  } catch {
    console.error(
      "No session ID found. Open localhost:3001 in a browser first,\n" +
      "then try again. Or set DRIVE_SESSION=<id> manually.\n" +
      `(Looked for .drive-session at: ${SESSION_FILE})`
    )
    process.exit(1)
  }
}

function parseArgs(tool, positional) {
  switch (tool) {
    case "setSearchField":
      return { field: positional[0], value: positional[1] }
    case "selectTire":
    case "selectTireForCheckout":
    case "scrollToProduct":
      return { productId: positional[0] }
    case "highlightProducts":
      return { productIds: positional }
    case "fillDimensionField":
      return { width: positional[0], profile: positional[1], rim: positional[2] }
    case "prefillCheckoutField":
      return { field: positional[0], value: positional[1] }
    default:
      return {}
  }
}

async function main() {
  const [, , tool, ...positional] = process.argv

  if (!tool || tool === "--help" || tool === "-h") {
    console.log("Usage: node scripts/drive.mjs <tool> [args...]")
    console.log("       node scripts/drive.mjs sessions")
    process.exit(0)
  }

  if (tool === "sessions") {
    const res = await fetch(`${BASE_URL}/api/agent/sessions`)
    const data = await res.json()
    if (!data.length) {
      console.log("No active sessions. Open localhost:3001 in a browser.")
    } else {
      for (const s of data) {
        const age = Math.round((Date.now() - s.lastSeen) / 1000)
        console.log(`${s.sessionId}  (last seen ${age}s ago)`)
      }
    }
    return
  }

  const sessionId = await getSessionId()
  const args = parseArgs(tool, positional)

  const res = await fetch(`${BASE_URL}/api/agent/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, tool, args }),
  })

  const data = await res.json()

  if (!res.ok || !data.ok) {
    console.error(`✗ ${tool} failed:`, data.error ?? data)
    process.exit(1)
  }

  console.log(`✓ ${tool}`, JSON.stringify(data.result ?? {}, null, 2))
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
