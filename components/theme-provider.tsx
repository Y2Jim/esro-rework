"use client"

import { useEffect, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { getThemeById } from "@/lib/rollable-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const uiTheme = useEsroStore((s) => s.uiTheme)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Check if it's a rollable theme
    const rollableTheme = getThemeById(uiTheme)
    
    if (rollableTheme) {
      // Apply rollable theme via CSS custom properties
      document.documentElement.setAttribute("data-theme", "rollable")
      document.documentElement.style.setProperty("--rollable-accent", rollableTheme.colors.accent)
      document.documentElement.style.setProperty("--rollable-accent-bright", rollableTheme.colors.accentBright)
      document.documentElement.style.setProperty("--rollable-bg", rollableTheme.colors.background)
      document.documentElement.style.setProperty("--rollable-panel", rollableTheme.colors.panel)
    } else if (uiTheme === "default") {
      document.documentElement.removeAttribute("data-theme")
      // Clear rollable properties
      document.documentElement.style.removeProperty("--rollable-accent")
      document.documentElement.style.removeProperty("--rollable-accent-bright")
      document.documentElement.style.removeProperty("--rollable-bg")
      document.documentElement.style.removeProperty("--rollable-panel")
    } else {
      // Faction theme
      document.documentElement.setAttribute("data-theme", uiTheme)
      // Clear rollable properties
      document.documentElement.style.removeProperty("--rollable-accent")
      document.documentElement.style.removeProperty("--rollable-accent-bright")
      document.documentElement.style.removeProperty("--rollable-bg")
      document.documentElement.style.removeProperty("--rollable-panel")
    }
  }, [uiTheme, mounted])

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
