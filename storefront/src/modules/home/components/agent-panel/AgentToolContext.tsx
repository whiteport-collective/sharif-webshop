"use client"

import { createContext, useContext } from "react"

export type AgentToolHandlers = {
  fillDimensionField: (width: number, profile: number, rim: number) => void
  triggerSearch: () => void
  selectTire: (productId: string) => void
  scrollToProduct: (productId: string) => void
  prefillCheckoutField: (field: string, value: string) => void
  openPaymentStep: () => void
}

const AgentToolContext = createContext<AgentToolHandlers>({
  fillDimensionField: () => {},
  triggerSearch: () => {},
  selectTire: () => {},
  scrollToProduct: () => {},
  prefillCheckoutField: () => {},
  openPaymentStep: () => {},
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
