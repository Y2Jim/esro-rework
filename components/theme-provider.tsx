"use client"

import { useEffect, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const uiTheme = useEsroStore((s) => s.uiTheme)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Apply theme to document
    if (uiTheme === "default") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", uiTheme)
    }
  }, [uiTheme, mounted])

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
