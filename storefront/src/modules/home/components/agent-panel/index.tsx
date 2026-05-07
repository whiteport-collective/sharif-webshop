"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useStreamingChat } from "./useStreamingChat"
import { useLanguage } from "@lib/i18n"
import type { SessionContext } from "@modules/home/components/flow-shell/types"
import type { HttpTypes } from "@medusajs/types"

type RecommendedProductEntry = {
  product: HttpTypes.StoreProduct
  tier: "best" | "better" | "good"
  tierLabel: string
  priceFormatted: string | null
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []

  function inlineMarkdown(line: string, key: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
    let last = 0
    let match: RegExpExecArray | null
    let i = 0
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index))
      if (match[1] != null) parts.push(<strong key={`${key}-b${i}`}>{match[1]}</strong>)
      else if (match[2] != null) parts.push(<em key={`${key}-i${i}`}>{match[2]}</em>)
      last = match.index + match[0].length
      i++
    }
    if (last < line.length) parts.push(line.slice(last))
    return parts
  }

  lines.forEach((line, idx) => {
    const key = String(idx)
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (numberedMatch) {
      nodes.push(
        <div key={key} className="flex gap-2 my-0.5">
          <span className="shrink-0 font-semibold">{numberedMatch[1]}.</span>
          <span>{inlineMarkdown(numberedMatch[2], key)}</span>
        </div>
      )
    } else if (line.trim() === "") {
      nodes.push(<div key={key} className="h-2" />)
    } else {
      nodes.push(<span key={key}>{inlineMarkdown(line, key)}</span>)
    }
  })
  return nodes
}

type Props = {
  open: boolean
  onClose: () => void
  getSessionContext: () => SessionContext
  recommendedProducts?: RecommendedProductEntry[]
  onSelectTire?: (product: HttpTypes.StoreProduct, qty: number) => void
  qty?: number
}

function AgentPanelContent({ getSessionContext, recommendedProducts, onSelectTire, qty }: Omit<Props, "open" | "onClose">) {
  const [input, setInput] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  const getContext = useCallback(() => getSessionContext(), [getSessionContext])
  const { messages, sendMessage, isStreaming, newChat, switchTo, sessions, currentId } =
    useStreamingChat(getContext)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  // Auto-focus input when the panel mounts (chat opens) — cursor ready to type.
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    sendMessage(text)
  }

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt)
    textareaRef.current?.focus()
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [menuOpen])

  const sessionTitle = (s: { messages: { role: string; content: string }[]; startedAt: string }) => {
    const firstUser = s.messages.find((m) => m.role === "user")
    if (firstUser) return firstUser.content.trim().slice(0, 36) + (firstUser.content.length > 36 ? "…" : "")
    return "Ny chat"
  }

  const formatWhen = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    const time = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })
    if (sameDay) return `I dag ${time}`
    const date = d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" })
    return `${date} ${time}`
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )
  const previousSessions = sortedSessions.filter((s) => s.id !== currentId)
  const currentMeta = sortedSessions.find((s) => s.id === currentId)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    t.chatSuggestBuySummer,
    t.chatSuggestBestForCar,
    t.chatSuggestRebookOrOrder,
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] px-4">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-[#212529]">Sharif-rådgiver</span>
          <span className="ml-2 rounded-full bg-[#f8f9fa] px-2 py-0.5 text-[11px] text-[#6c757d]">Beta</span>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6c757d] transition-colors hover:bg-[#f1f3f5] hover:text-[#212529]"
            aria-label="Chat-meny"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  newChat()
                  setMenuOpen(false)
                  setTimeout(() => textareaRef.current?.focus(), 0)
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#212529] hover:bg-[#f8f9fa]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Ny chat
              </button>

              {currentMeta && (
                <>
                  <div className="border-t border-[#f1f3f5]" />
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#adb5bd]">
                    Nåværende
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    disabled
                    className="flex w-full flex-col items-start gap-0.5 bg-[#f8f9fa] px-4 py-2.5 text-left text-sm text-[#212529]"
                  >
                    <span className="line-clamp-1">{sessionTitle(currentMeta)}</span>
                    <span className="text-[11px] text-[#6c757d]">{formatWhen(currentMeta.startedAt)}</span>
                  </button>
                </>
              )}

              {previousSessions.length > 0 && (
                <>
                  <div className="border-t border-[#f1f3f5]" />
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#adb5bd]">
                    Tidligere
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {previousSessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          switchTo(s.id)
                          setMenuOpen(false)
                        }}
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm text-[#212529] hover:bg-[#f8f9fa]"
                      >
                        <span className="line-clamp-1">{sessionTitle(s)}</span>
                        <span className="text-[11px] text-[#6c757d]">{formatWhen(s.startedAt)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#212529] text-white animate-[chat-reveal_500ms_ease-out]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            <p className="text-sm leading-relaxed text-[#212529] animate-[chat-reveal_600ms_ease-out_200ms_both]">
              {t.chatWelcomeIntro}
            </p>

            <p className="text-sm leading-relaxed text-[#212529] animate-[chat-reveal_600ms_ease-out_1000ms_both]">
              {t.chatWelcomeOrders}
            </p>

            <p className="text-sm leading-relaxed text-[#212529] animate-[chat-reveal_600ms_ease-out_1600ms_both]">
              {t.chatWelcomeQuestion}
            </p>

            <div className="flex flex-col gap-2 pt-1 animate-[chat-reveal_600ms_ease-out_2200ms_both]">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="rounded-full border border-[#dee2e6] bg-white px-4 py-2.5 text-left text-sm text-[#212529] transition-colors hover:border-[#adb5bd] hover:bg-[#f8f9fa]"
                >
                  {s}
                </button>
              ))}
            </div>
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
              className={`max-w-[82%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-[#f1f3f5] px-3.5 py-2.5 text-[#212529] whitespace-pre-wrap"
                  : "text-[#212529]"
              }`}
            >
              {msg.content
                ? (msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content)
                : (isStreaming && i === messages.length - 1 ? (
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

      {/* Recommended products — quick add to cart */}
      {recommendedProducts && recommendedProducts.length > 0 && onSelectTire && (
        <div className="shrink-0 border-t border-[#dee2e6] px-3 py-2 flex flex-col gap-1.5">
          {recommendedProducts.map(({ product, tier, tierLabel, priceFormatted }) => (
            <div key={product.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
              <div className="min-w-0">
                <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide mr-1.5 ${
                  tier === "best" ? "bg-emerald-100 text-emerald-700" :
                  tier === "better" ? "bg-amber-100 text-amber-700" :
                  "bg-sky-100 text-sky-700"
                }`}>{tierLabel}</span>
                <span className="text-xs font-medium text-[#212529] truncate">{product.title}</span>
                {priceFormatted && <span className="ml-1.5 text-xs text-[#6c757d]">{priceFormatted}/stk</span>}
              </div>
              <button
                type="button"
                onClick={() => onSelectTire(product, qty ?? 4)}
                className="shrink-0 rounded-lg bg-[#212529] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#343a40]"
              >
                Velg
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input — GPT-style box */}
      <div className="shrink-0 p-3">
        <div className="flex flex-col rounded-2xl border border-[#dee2e6] bg-white shadow-sm focus-within:border-[#adb5bd] transition-colors">
          <textarea
            ref={textareaRef}
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

export default function AgentPanel({ open, onClose, getSessionContext, recommendedProducts, onSelectTire, qty }: Props) {
  const contentProps = { getSessionContext, recommendedProducts, onSelectTire, qty }
  return (
    <>
      {/* Mobile/tablet: fixed overlay when open */}
      {open && (
        <div className="fixed bottom-0 right-0 top-14 z-[80] flex w-full flex-col border-l border-[#dee2e6] bg-white shadow-2xl sm:w-[360px] lg:hidden">
          <AgentPanelContent {...contentProps} />
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
        {open && <AgentPanelContent {...contentProps} />}
      </aside>
    </>
  )
}
