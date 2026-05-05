"use client"

import { useState, useCallback, useRef } from "react"
import { useAgentTools } from "./AgentToolContext"
import type { SessionContext } from "@modules/home/components/flow-shell/types"

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export type ChatSession = {
  id: string
  startedAt: string
  messages: ChatMessage[]
}

const SESSIONS_KEY = "sharif-agent-sessions"
const CURRENT_KEY = "sharif-agent-current"
const MAX_SESSIONS = 20
const MAX_MESSAGES_PER_SESSION = 40

function newSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    const trimmed = sessions
      .slice(-MAX_SESSIONS)
      .map((s) => ({ ...s, messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION) }))
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed))
  } catch {}
}

function loadCurrentId(sessions: ChatSession[]): string | null {
  if (typeof window === "undefined") return null
  try {
    const id = localStorage.getItem(CURRENT_KEY)
    if (id && sessions.some((s) => s.id === id)) return id
  } catch {}
  return sessions.at(-1)?.id ?? null
}

function saveCurrentId(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id)
    else localStorage.removeItem(CURRENT_KEY)
  } catch {}
}

export function useStreamingChat(getContext: () => SessionContext) {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions)
  const [currentId, setCurrentId] = useState<string | null>(() => loadCurrentId(loadSessions()))
  const [isStreaming, setIsStreaming] = useState(false)
  const tools = useAgentTools()
  const abortRef = useRef<AbortController | null>(null)
  // Ref keeps currentId accessible inside setSessions updaters without stale closure.
  // We also update it immediately when creating/switching sessions so that two
  // synchronous setMessages calls in sendMessage share the same session.
  const currentIdRef = useRef<string | null>(currentId)
  currentIdRef.current = currentId

  const currentSession = sessions.find((s) => s.id === currentId) ?? null
  const messages = currentSession?.messages ?? []

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setSessions((prev) => {
        // Resolve the active session (creating one lazily on first message).
        let activeId = currentIdRef.current
        let list = prev
        if (!activeId || !list.some((s) => s.id === activeId)) {
          activeId = newSessionId()
          list = [...list, { id: activeId, startedAt: new Date().toISOString(), messages: [] }]
          // Update the ref immediately so the next synchronous setMessages call
          // in the same batch sees the already-created session instead of
          // creating yet another one.
          currentIdRef.current = activeId
          setCurrentId(activeId)
          saveCurrentId(activeId)
        }
        const next = list.map((s) => {
          if (s.id !== activeId) return s
          const nextMessages =
            typeof updater === "function" ? updater(s.messages) : updater
          return { ...s, messages: nextMessages }
        })
        saveSessions(next)
        return next
      })
    },
    [] // reads currentId via ref — no stale closure
  )

  const dispatchToolCall = useCallback(
    (name: string, input: Record<string, unknown>) => {
      switch (name) {
        case "setSearchField":
          tools.setSearchField(
            input.field as "width" | "profile" | "rim" | "qty" | "season",
            String(input.value ?? "")
          )
          break
        case "fillDimensionField":
          tools.fillDimensionField(
            input.width as number,
            input.profile as number,
            input.rim as number
          )
          break
        case "triggerSearch":
          tools.triggerSearch()
          break
        case "selectTire":
          tools.selectTire(input.productId as string)
          break
        case "selectTireForCheckout":
          tools.selectTireForCheckout(input.productId as string)
          break
        case "recommendProducts":
          tools.recommendProducts(input as { best: string; better: string; good: string })
          break
        case "highlightProducts":
          tools.highlightProducts(input.productIds as string[])
          break
        case "clearHighlights":
          tools.clearHighlights()
          break
        case "sortProducts":
          tools.sortProducts(String(input.sortBy ?? "price"))
          break
        case "scrollToProduct":
          tools.scrollToProduct(input.productId as string)
          break
        case "prefillCheckoutField":
          tools.prefillCheckoutField(input.field as string, input.value as string)
          break
        case "advanceCheckoutStep":
          tools.advanceCheckoutStep()
          break
        case "getCheckoutState":
          tools.getCheckoutState()
          break
        case "openPaymentStep":
          tools.openPaymentStep()
          break
        case "navigateBack":
          tools.navigateBack()
          break
      }
    },
    [tools]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      const userMsg: ChatMessage = { role: "user", content: text.trim() }
      const updated = [...messages, userMsg]
      setMessages(updated)
      setIsStreaming(true)

      const assistantMsg: ChatMessage = { role: "assistant", content: "" }
      setMessages([...updated, assistantMsg])

      abortRef.current = new AbortController()

      let assistantText = ""

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated,
            sessionContext: getContext(),
          }),
          signal: abortRef.current.signal,
        })

        if (!res.body) throw new Error("No stream body")

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
            try {
              const event = JSON.parse(line.slice(6))
              if (event.type === "text") {
                assistantText += event.text
                setMessages((prev) => {
                  const next = [...prev]
                  next[next.length - 1] = { role: "assistant", content: assistantText }
                  return next
                })
              } else if (event.type === "tool_call") {
                dispatchToolCall(event.name, event.input ?? {})
              }
            } catch {}
          }
        }
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === "AbortError"
        if (!isAbort) {
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = {
              role: "assistant",
              content: "Beklager, noe gikk galt. Prøv igjen.",
            }
            return next
          })
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, isStreaming, getContext, dispatchToolCall, setMessages]
  )

  const newChat = useCallback(() => {
    const id = newSessionId()
    setSessions((prev) => {
      const next = [...prev, { id, startedAt: new Date().toISOString(), messages: [] }]
      saveSessions(next)
      return next
    })
    currentIdRef.current = id
    setCurrentId(id)
    saveCurrentId(id)
  }, [])

  const switchTo = useCallback((id: string) => {
    currentIdRef.current = id
    setCurrentId(id)
    saveCurrentId(id)
  }, [])

  return {
    messages,
    sendMessage,
    isStreaming,
    newChat,
    switchTo,
    sessions,
    currentId,
  }
}
