import React, { createContext, useContext, useMemo, useState, useCallback } from "react"
import { useLocation } from "react-router"
import type { IAiContext, IAiStatus } from "@iraf/core"

// ─── Page context ───────────────────────────────────────────────────────────

const AiPageContext = createContext<IAiContext>({})

export function useAiContext(): IAiContext {
  return useContext(AiPageContext)
}

export function AiContextProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const context = useMemo<IAiContext>(() => {
    const parts = location.pathname.split("/").filter(Boolean)
    return {
      currentModule: parts[0],
      currentEntity: parts[1],
      currentRecordId: parts[2] !== "new" ? parts[2] : undefined,
      currentView: parts[2] ? "detail" : "list",
    }
  }, [location.pathname])

  return (
    <AiPageContext.Provider value={context}>
      {children}
    </AiPageContext.Provider>
  )
}

// ─── Panel open/close state ─────────────────────────────────────────────────

interface AiPanelState {
  open: boolean
  toggle: () => void
  status: IAiStatus
  setStatus: (s: IAiStatus) => void
}

const AiPanelContext = createContext<AiPanelState>({
  open: false,
  toggle: () => {},
  status: { enabled: false, hasAccess: false },
  setStatus: () => {},
})

export function useAiPanel(): AiPanelState {
  return useContext(AiPanelContext)
}

export function AiPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<IAiStatus>({ enabled: false, hasAccess: false })
  const toggle = useCallback(() => setOpen(v => !v), [])

  return (
    <AiPanelContext.Provider value={{ open, toggle, status, setStatus }}>
      {children}
    </AiPanelContext.Provider>
  )
}
