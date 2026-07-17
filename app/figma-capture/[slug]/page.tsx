"use client"

/**
 * FIGMA CAPTURE — single target route (development tooling only).
 *
 * /figma-capture/<slug>          → target + info footer (for manual viewing)
 * /figma-capture/<slug>?capture=1 → bare target only (for Playwright)
 */

import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { CaptureFrame } from "@/components/figma-capture/capture-frame"
import { getCaptureBySlug } from "@/lib/figma-capture-registry"

export default function CaptureSlugPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const captureMode = searchParams.get("capture") === "1"
  const entry = getCaptureBySlug(params.slug)

  useEffect(() => {
    if (captureMode) {
      document.body.classList.add("figma-capture-mode")
      return () => document.body.classList.remove("figma-capture-mode")
    }
  }, [captureMode])

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0810] text-[#c9bdf5]">
        <div className="text-center">
          <div className="text-sm">Unknown capture: {params.slug}</div>
          <Link href="/figma-capture" className="mt-2 inline-block text-xs text-[#8a7fd0] underline">
            Back to gallery
          </Link>
        </div>
      </div>
    )
  }

  if (captureMode) {
    // Bare target, pinned to the top-left corner, no chrome.
    return (
      <div className="figma-capture-stage">
        <CaptureFrame entry={entry} showInfo={false} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0810] px-6 py-8">
      <Link href="/figma-capture" className="text-xs text-[#8a7fd0] underline">
        ← Back to gallery
      </Link>
      <div className="mt-4 flex flex-col items-center">
        <h1 className="mb-4 text-sm uppercase tracking-[0.3em] text-[#c9bdf5]">{entry.title}</h1>
        <CaptureFrame entry={entry} showInfo />
      </div>
    </div>
  )
}
