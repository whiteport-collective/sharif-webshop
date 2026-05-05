import { createServer } from "node:http"
import { AGENT_HOST, AGENT_PORT } from "./shared/db.js"
import { handleAdminAgent } from "./admin-agent/index.js"
import { handleCustomerAgent } from "./customer-agent/index.js"
import { handlePreflight, readJsonBody, sendJson } from "./shared/http.js"
import type { AgentRequestBody } from "./shared/runtime.js"

const server = createServer(async (req, res) => {
  try {
    if (handlePreflight(req, res)) {
      return
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === "POST" && url.pathname === "/agent/customer") {
      const body = await readJsonBody<AgentRequestBody>(req)
      await handleCustomerAgent(body, res)
      return
    }

    if (req.method === "POST" && url.pathname === "/agent/admin") {
      const body = await readJsonBody<AgentRequestBody>(req)
      await handleAdminAgent(body, res)
      return
    }

    sendJson(res, 404, { error: "Not found" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error"
    sendJson(res, 400, { error: message })
  }
})

server.listen(AGENT_PORT, AGENT_HOST, () => {
  console.log(`Sharif agent service listening on http://${AGENT_HOST}:${AGENT_PORT}`)
})
