"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type NavRailContextValue = {
  /** id of the rail currently expanded, or null when all are collapsed */
  expandedRail: string | null
  isExpanded: (id: string) => boolean
  toggleRail: (id: string) => void
  collapseAll: () => void
}

const NavRailContext = createContext<NavRailContextValue | null>(null)

export function NavRailProvider({ children }: { children: ReactNode }) {
  const [expandedRail, setExpandedRail] = useState<string | null>(null)

  const isExpanded = useCallback((id: string) => expandedRail === id, [expandedRail])
  // Accordion behavior: opening one rail collapses any other so two overlays
  // can never stack on top of each other in the narrow phone frame.
  const toggleRail = useCallback((id: string) => setExpandedRail((cur) => (cur === id ? null : id)), [])
  const collapseAll = useCallback(() => setExpandedRail(null), [])

  const value = useMemo(
    () => ({ expandedRail, isExpanded, toggleRail, collapseAll }),
    [expandedRail, isExpanded, toggleRail, collapseAll],
  )
  return <NavRailContext.Provider value={value}>{children}</NavRailContext.Provider>
}

export function useNavRail() {
  const ctx = useContext(NavRailContext)
  if (!ctx) throw new Error("useNavRail must be used within a NavRailProvider")
  return ctx
}
