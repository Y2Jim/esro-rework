"use client"

/**
 * FIGMA CAPTURE GALLERY (development tooling only).
 *
 * A searchable, filterable index of every registered capture state.
 */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CAPTURE_REGISTRY,
  CAPTURE_CATEGORIES,
  CAPTURE_VIEWPORT,
  type CaptureCategory,
} from "@/lib/figma-capture-registry"

export function CaptureGallery() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CaptureCategory | "all">("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CAPTURE_REGISTRY.filter((c) => {
      if (category !== "all" && c.category !== category) return false
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.filename.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    CAPTURE_REGISTRY.forEach((c) => {
      map[c.category] = (map[c.category] ?? 0) + 1
    })
    return map
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0810] text-[#e6dffb]">
      <header className="border-b border-[#241a3a] px-6 py-6">
        <h1 className="text-lg font-semibold tracking-tight text-[#f0eaff]">ESRO Figma Capture System</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#9a8fc0]">
          {CAPTURE_REGISTRY.length} registered capture states rendered from the live ESRO frontend at{" "}
          {CAPTURE_VIEWPORT.width}×{CAPTURE_VIEWPORT.height} @{CAPTURE_VIEWPORT.deviceScaleFactor}x. Open a
          capture to view it, or run{" "}
          <code className="rounded bg-[#181128] px-1.5 py-0.5 font-mono text-xs text-[#c9bdf5]">
            pnpm capture:figma
          </code>{" "}
          to export every PNG.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, description, slug, filename, component…"
            className="w-full max-w-xl rounded-md border border-[#2c2148] bg-[#120c20] px-3 py-2 text-sm text-[#e6dffb] outline-none placeholder:text-[#6f6592] focus:border-[#5a44a0]"
          />
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label={`All (${CAPTURE_REGISTRY.length})`} active={category === "all"} onClick={() => setCategory("all")} />
            {CAPTURE_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                label={`${cat} (${counts[cat] ?? 0})`}
                active={category === cat}
                onClick={() => setCategory(cat)}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="mb-4 text-xs uppercase tracking-widest text-[#6f6592]">
          Showing {filtered.length} of {CAPTURE_REGISTRY.length}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/figma-capture/${c.slug}`}
              className="group flex flex-col rounded-lg border border-[#241a3a] bg-[#120c20] p-3 transition-colors hover:border-[#5a44a0]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-[#1d1533] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#a898e0]">
                  {c.category}
                </span>
                {c.animation && c.animation !== "none" && (
                  <span className="text-[10px] uppercase tracking-wider text-[#6f6592]">anim: {c.animation}</span>
                )}
              </div>
              <div className="mt-2 text-sm font-medium text-[#f0eaff] group-hover:text-white">{c.title}</div>
              <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#9a8fc0]">{c.description}</div>
              <div className="mt-auto pt-3">
                <div className="truncate font-mono text-[10px] text-[#c9bdf5]">{c.filename}</div>
                <div className="mt-0.5 truncate text-[10px] text-[#6f6592]">{c.source}</div>
                <div className="mt-0.5 text-[10px] text-[#6f6592]">
                  {CAPTURE_VIEWPORT.width}×{CAPTURE_VIEWPORT.height}
                  {c.state?.uiTheme && c.state.uiTheme !== "default" ? ` · ${c.state.uiTheme}` : ""}
                  {c.scroll ? ` · ${c.scroll}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs capitalize transition-colors " +
        (active
          ? "border-[#5a44a0] bg-[#241a3a] text-[#f0eaff]"
          : "border-[#241a3a] bg-transparent text-[#9a8fc0] hover:border-[#3a2c60]")
      }
    >
      {label}
    </button>
  )
}
