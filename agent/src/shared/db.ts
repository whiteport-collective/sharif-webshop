import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { config as loadDotenv } from "dotenv"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types.js"

const currentDir = dirname(fileURLToPath(import.meta.url))

loadDotenv({ path: resolve(currentDir, "../../../.env") })
loadDotenv()

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"] as const

for (const key of requiredEnv) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const AGENT_PORT = Number.parseInt(process.env.AGENT_PORT ?? "8787", 10)
export const AGENT_HOST = process.env.AGENT_HOST?.trim() || "0.0.0.0"
export const AGENT_CORS_ORIGIN = process.env.AGENT_CORS_ORIGIN?.trim() || "*"
export const DEFAULT_MODEL = process.env.SHARIF_ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514"

let client: SupabaseClient<Database> | undefined

export function getSupabase() {
  if (!client) {
    client = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return client
}

export function getSharifSchema() {
  return getSupabase().schema("sharif")
}
