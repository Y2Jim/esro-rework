"use client"

import { useEffect } from "react"
import { useEsroStore } from "@/store/use-esro-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const uiTheme = useEsroStore((s) => s.uiTheme)

  useEffect(() => {
    // Apply theme to document
    if (uiTheme === "default") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", uiTheme)
    }
  }, [uiTheme])

  return <>{children}</>
}
