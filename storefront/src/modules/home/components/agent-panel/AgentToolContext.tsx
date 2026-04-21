"use client"

import { createContext, useContext } from "react"

export type AgentSearchField = "width" | "profile" | "rim" | "qty" | "season"

export type ToolResult =
  | { ok: true; [key: string]: unknown }
  | { ok: false; reason: string; recoverable?: boolean }

export type AgentToolHandlers = {
  // Home domain
  setSearchField: (field: AgentSearchField, value: string) => void
  triggerSearch: () => void
  // Legacy — kept as internal convenience wrapper, no longer in LLM tool list
  fillDimensionField: (width: number, profile: number, rim: number) => void
  // Results domain
  selectTire: (productId: string) => void
  selectTireForCheckout: (productId: string) => void
  scrollToProduct: (productId: string) => void
  highlightProducts: (productIds: string[]) => void
  clearHighlights: () => void
  // Checkout domain
  prefillCheckoutField: (field: string, value: string) => void
  advanceCheckoutStep: () => void
  getCheckoutState: () => void
  openPaymentStep: () => void
  // Navigation
  navigateBack: () => void
}

const AgentToolContext = createContext<AgentToolHandlers>({
  setSearchField: () => {},
  triggerSearch: () => {},
  fillDimensionField: () => {},
  selectTire: () => {},
  selectTireForCheckout: () => {},
  scrollToProduct: () => {},
  highlightProducts: () => {},
  clearHighlights: () => {},
  prefillCheckoutField: () => {},
  advanceCheckoutStep: () => {},
  getCheckoutState: () => {},
  openPaymentStep: () => {},
  navigateBack: () => {},
})

export function AgentToolContextProvider({
  children,
  handlers,
}: {
  children: React.ReactNode
  handlers: AgentToolHandlers
}) {
  return (
    <AgentToolContext.Provider value={handlers}>
      {children}
    </AgentToolContext.Provider>
  )
}

export function useAgentTools(): AgentToolHandlers {
  return useContext(AgentToolContext)
}
