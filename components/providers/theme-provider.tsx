"use client"

import { useEffect } from "react"
import { useEsroStore } from "@/store/use-esro-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useEsroStore((s) => s.theme)

  useEffect(() => {
    // Apply theme to html element
    const html = document.documentElement
    
    // Remove all faction theme attributes
    html.removeAttribute("data-theme")
    
    // Apply new theme if not default
    if (theme && theme !== "default") {
      html.setAttribute("data-theme", theme)
    }
  }, [theme])

  return <>{children}</>
}
