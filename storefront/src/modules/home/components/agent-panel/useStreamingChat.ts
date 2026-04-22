"use client"

import { useState, useCallback, useRef } from "react"
import { useAgentTools } from "./AgentToolContext"
import type { SessionContext } from "@modules/home/components/flow-shell/types"

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const STORAGE_KEY = "sharif-agent-messages"

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)))
  } catch {}
}

export function useStreamingChat(getContext: () => SessionContext) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const tools = useAgentTools()
  const abortRef = useRef<AbortController | null>(null)

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
        setMessages((prev) => {
          saveMessages(prev)
          return prev
        })
      }
    },
    [messages, isStreaming, getContext, dispatchToolCall]
  )

  const clearHistory = useCallback(() => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { messages, sendMessage, isStreaming, clearHistory }
}
