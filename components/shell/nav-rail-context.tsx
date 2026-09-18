"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type NavRailContextValue = {
  /** whether the single left menu is expanded (labels + group headings visible) */
  expanded: boolean
  toggle: () => void
  setExpanded: (v: boolean) => void
}

const NavRailContext = createContext<NavRailContextValue | null>(null)

export function NavRailProvider({ children }: { children: ReactNode }) {
  // Closed by default: the menu starts as a slim icon-only rail until tapped.
  const [expanded, setExpanded] = useState(false)

  const toggle = useCallback(() => setExpanded((v) => !v), [])

  const value = useMemo(() => ({ expanded, toggle, setExpanded }), [expanded, toggle])
  return <NavRailContext.Provider value={value}>{children}</NavRailContext.Provider>
}

export function useNavRail() {
  const ctx = useContext(NavRailContext)
  if (!ctx) throw new Error("useNavRail must be used within a NavRailProvider")
  return ctx
}
