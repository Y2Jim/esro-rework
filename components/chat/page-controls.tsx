"use client"

import { useEsroStore } from "@/store/use-esro-store"

export function PageControls() {
  const nudgePage = useEsroStore((s) => s.nudgePage)
  const resetPage = useEsroStore((s) => s.resetPage)
  const pageOffset = useEsroStore((s) => s.pageOffset)

  return (
    <div className="flex items-center gap-0.5 text-[11px] uppercase tracking-[0.2em]">
      <button
        type="button"
        onClick={() => nudgePage(1)}
        className="rounded-sm border border-[color:var(--color-border-soft)] px-1.5 py-[2px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-border)] hover:text-[color:var(--color-lilac)]"
        aria-label="page up"
      >
        pg↑
      </button>
      <button
        type="button"
        onClick={() => nudgePage(-1)}
        disabled={pageOffset === 0}
        className="rounded-sm border border-[color:var(--color-border-soft)] px-1.5 py-[2px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-border)] hover:text-[color:var(--color-lilac)] disabled:opacity-30 disabled:hover:text-[color:var(--color-muted)]"
        aria-label="page down"
      >
        pg↓
      </button>
      {pageOffset > 0 && (
        <button
          type="button"
          onClick={resetPage}
          className="ml-1 rounded-sm px-1.5 py-[2px] text-[color:var(--color-violet-bright)] transition-colors hover:text-glow"
          aria-label="jump to latest"
        >
          now
        </button>
      )}
    </div>
  )
}
