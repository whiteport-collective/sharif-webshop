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
  open: boolean
  onClose: () => void
  getSessionContext: () => SessionContext
}

function AgentPanelContent({ getSessionContext }: Omit<Props, "open" | "onClose">) {
  const [input, setInput] = useState("")
  const chatRef = useRef<HTMLDivElement>(null)

  const getContext = useCallback(() => getSessionContext(), [getSessionContext])
  const { messages, sendMessage, isStreaming, clearHistory } = useStreamingChat(getContext)

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center border-b border-[#dee2e6] px-4">
        <span className="text-sm font-semibold text-[#212529]">Sharif-rådgiver</span>
        <span className="ml-2 rounded-full bg-[#f8f9fa] px-2 py-0.5 text-[11px] text-[#6c757d]">Beta</span>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#212529] text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#212529]">Hva leter du etter?</p>
            <p className="text-xs text-[#6c757d]">F.eks. "205/55R16" eller "vinterdekk til SUV"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#212529] text-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[82%] text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-[#f1f3f5] px-3.5 py-2.5 text-[#212529]"
                  : "text-[#212529]"
              }`}
            >
              {msg.content ||
                (isStreaming && i === messages.length - 1 ? (
                  <span className="flex gap-1 py-1">
                    <span className="animate-bounce inline-block h-1.5 w-1.5 rounded-full bg-[#adb5bd]" style={{ animationDelay: "0ms" }} />
                    <span className="animate-bounce inline-block h-1.5 w-1.5 rounded-full bg-[#adb5bd]" style={{ animationDelay: "150ms" }} />
                    <span className="animate-bounce inline-block h-1.5 w-1.5 rounded-full bg-[#adb5bd]" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : "")}
            </div>
          </div>
        ))}
      </div>

      {/* Input — GPT-style box */}
      <div className="shrink-0 p-3">
        <div className="flex flex-col rounded-2xl border border-[#dee2e6] bg-white shadow-sm focus-within:border-[#adb5bd] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Skriv din melding…"
            disabled={isStreaming}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm leading-relaxed text-[#212529] placeholder:text-[#adb5bd] focus:outline-none disabled:opacity-50"
            style={{ maxHeight: 120 }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <label
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#adb5bd] transition-colors hover:bg-[#f1f3f5] hover:text-[#495057]"
              title="Last opp fil"
              aria-label="Last opp fil"
            >
              <input type="file" className="sr-only" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </label>
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#212529] text-white transition-colors hover:bg-[#343a40] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentPanel({ open, onClose, getSessionContext }: Props) {
  return (
    <>
      {/* Mobile/tablet: fixed overlay when open */}
      {open && (
        <div className="fixed bottom-0 right-0 top-14 z-[80] flex w-full flex-col border-l border-[#dee2e6] bg-white shadow-2xl sm:w-[360px] lg:hidden">
          <AgentPanelContent getSessionContext={getSessionContext} />
        </div>
      )}

      {/* Desktop: persistent column, slides in/out via width */}
      <aside
        className="hidden flex-none flex-col overflow-hidden border-l border-[#dee2e6] bg-white lg:flex"
        style={{
          width: open ? "360px" : "0px",
          borderColor: open ? undefined : "transparent",
          transition: "width 300ms ease-in-out, border-color 300ms ease-in-out",
        }}
      >
        {open && <AgentPanelContent getSessionContext={getSessionContext} />}
      </aside>
    </>
  )
}
