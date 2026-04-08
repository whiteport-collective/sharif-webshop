"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useStreamingChat } from "./useStreamingChat"

type SessionContext = {
  view: string
  dimension: string | null
  visibleProductIds: string[]
  cartItems: { productId: string; qty: number }[]
  step: string | null
}

type Props = {
  getSessionContext: () => SessionContext
}

export default function AgentPanel({ getSessionContext }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const chatRef = useRef<HTMLDivElement>(null)

  const getContext = useCallback(() => getSessionContext(), [getSessionContext])
  const { messages, sendMessage, isStreaming, clearHistory } = useStreamingChat(getContext)

  // Scroll to bottom on new content
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Toggle button — fixed bottom-right, above cart badge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-[#212529] text-white shadow-lg hover:bg-[#343a40] transition-colors"
          aria-label="Åpne dekkrådgiver"
          title="Chat med Sharif-rådgiveren"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-0 right-0 z-[75] flex h-full w-[360px] flex-col border-l border-[#dee2e6] bg-white shadow-2xl"
          style={{ maxHeight: "100vh" }}
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#212529]">Sharif-rådgiver</span>
              <span className="rounded-full bg-[#f8f9fa] px-2 py-0.5 text-[11px] text-[#6c757d]">Beta</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#adb5bd] hover:bg-[#f8f9fa] hover:text-[#212529] transition-colors"
                title="Tøm chat"
                aria-label="Tøm samtalehistorikk"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
                aria-label="Lukk"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f9fa] text-[#6c757d]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <p className="text-sm text-[#6c757d]">
                  Hva slags dekk leter du etter?<br />
                  <span className="text-xs">F.eks. "205/55R16" eller "vinterdekk til SUV"</span>
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-[#212529] text-white"
                      : "rounded-bl-sm border border-[#dee2e6] bg-white text-[#212529]"
                  }`}
                >
                  {msg.content ||
                    (isStreaming && i === messages.length - 1 ? (
                      <span className="flex gap-1">
                        <span className="animate-bounce delay-0 inline-block h-1.5 w-1.5 rounded-full bg-[#adb5bd]" />
                        <span className="animate-bounce delay-100 inline-block h-1.5 w-1.5 rounded-full bg-[#adb5bd]" />
                        <span className="animate-bounce delay-200 inline-block h-1.5 w-1.5 rounded-full bg-[#adb5bd]" />
                      </span>
                    ) : (
                      ""
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#dee2e6] p-3">
            <div className="flex items-end gap-2">
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dee2e6] bg-[#f8f9fa] text-[#6c757d] hover:bg-[#e9ecef] transition-colors"
                title="Last opp fil (kommer snart)"
                aria-label="Last opp fil"
              >
                +
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Skriv en melding…"
                disabled={isStreaming}
                className="flex-1 resize-none rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2 text-sm leading-snug text-[#212529] placeholder:text-[#adb5bd] focus:outline-none focus:ring-1 focus:ring-[#212529] disabled:opacity-50"
                style={{ maxHeight: 120 }}
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#212529] text-white transition-colors hover:bg-[#343a40] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
