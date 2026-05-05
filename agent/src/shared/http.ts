import type { IncomingMessage, ServerResponse } from "node:http"
import { AGENT_CORS_ORIGIN } from "./db.js"

export type JsonRecord = Record<string, unknown>

export function applyCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", AGENT_CORS_ORIGIN)
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization")
}

export function handlePreflight(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "OPTIONS") {
    return false
  }

  applyCorsHeaders(res)
  res.statusCode = 204
  res.end()
  return true
}

export async function readJsonBody<T extends JsonRecord>(req: IncomingMessage) {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim()
  if (!raw) {
    throw new Error("Request body is required")
  }

  return JSON.parse(raw) as T
}

export function sendJson(res: ServerResponse, statusCode: number, body: JsonRecord) {
  applyCorsHeaders(res)
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

export function startSse(res: ServerResponse) {
  applyCorsHeaders(res)
  res.statusCode = 200
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders?.()
}

export function writeSse(res: ServerResponse, payload: JsonRecord) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}
