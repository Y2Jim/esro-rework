import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "ESRO // Relay Terminal",
  description:
    "Enchanted Star Realms Online — hidden relay chat, field ops, and archive recovery.",
}

export const viewport: Viewport = {
  themeColor: "#08060d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jetbrains.variable} ${jetbrains.className} bg-[var(--color-bg)]`}
    >
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
