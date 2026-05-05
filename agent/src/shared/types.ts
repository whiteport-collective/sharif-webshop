export type AgentAudience = "customer" | "admin"

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export type JsonObject = { [key: string]: JsonValue | undefined }

export type AgentConfigRow = {
  id: string
  audience: AgentAudience
  name: string
  persona: string | null
  system_prompt: string
  active: boolean | null
  updated_at: string | null
}

export type AgentConfigInsert = {
  id?: string
  audience: AgentAudience
  name: string
  persona?: string | null
  system_prompt: string
  active?: boolean | null
  updated_at?: string | null
}

export type AgentConfigUpdate = Partial<AgentConfigInsert>

export type AgentSkillAudience = AgentAudience | "both"

export type AgentSkillRow = {
  id: string
  name: string
  version: number | null
  description: string | null
  content: string
  audience: AgentSkillAudience | null
  active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type AgentSkillInsert = {
  id?: string
  name: string
  version?: number | null
  description?: string | null
  content: string
  audience?: AgentSkillAudience | null
  active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type AgentSkillUpdate = Partial<AgentSkillInsert>

export type DialogRow = {
  id: string
  audience: AgentAudience
  user_id: string | null
  channel: string | null
  agent_config_id: string | null
  started_at: string | null
  ended_at: string | null
  metadata: JsonObject | null
}

export type DialogInsert = {
  id?: string
  audience: AgentAudience
  user_id?: string | null
  channel?: string | null
  agent_config_id?: string | null
  started_at?: string | null
  ended_at?: string | null
  metadata?: JsonObject | null
}

export type DialogUpdate = Partial<DialogInsert>

export type DialogTurnRole = "user" | "assistant" | "tool"

export type DialogTurnRow = {
  id: string
  dialog_id: string
  role: DialogTurnRole
  content: string | null
  tool_calls: JsonValue | null
  tool_results: JsonValue | null
  agent_snapshot: JsonObject | null
  created_at: string | null
}

export type DialogTurnInsert = {
  id?: string
  dialog_id: string
  role: DialogTurnRole
  content?: string | null
  tool_calls?: JsonValue | null
  tool_results?: JsonValue | null
  agent_snapshot?: JsonObject | null
  created_at?: string | null
}

export type DialogTurnUpdate = Partial<DialogTurnInsert>

export type ViewRow = {
  id: string
  view_key: string
  view_type: string
  payload: JsonValue
  created_by_dialog: string | null
  expires_at: string | null
  consumed_at: string | null
  created_at: string | null
}

export type ViewInsert = {
  id?: string
  view_key: string
  view_type: string
  payload: JsonValue
  created_by_dialog?: string | null
  expires_at?: string | null
  consumed_at?: string | null
  created_at?: string | null
}

export type ViewUpdate = Partial<ViewInsert>

export type SharifSchema = {
  agent_config: {
    Row: AgentConfigRow
    Insert: AgentConfigInsert
    Update: AgentConfigUpdate
  }
  agent_skills: {
    Row: AgentSkillRow
    Insert: AgentSkillInsert
    Update: AgentSkillUpdate
  }
  dialogs: {
    Row: DialogRow
    Insert: DialogInsert
    Update: DialogUpdate
  }
  dialog_turns: {
    Row: DialogTurnRow
    Insert: DialogTurnInsert
    Update: DialogTurnUpdate
  }
  views: {
    Row: ViewRow
    Insert: ViewInsert
    Update: ViewUpdate
  }
}

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
  sharif: {
    Tables: SharifSchema
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type AgentSnapshot = {
  audience: AgentAudience
  config: {
    id: string
    name: string
    updated_at: string | null
  }
  skills: {
    id: string
    name: string
    version: number | null
    updated_at: string | null
  }[]
}
