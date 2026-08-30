"use client"

/**
 * FIGMA CAPTURE FRAME — development tooling only.
 *
 * Renders a single registered capture target at the exact ESRO viewport
 * (464 x 936), applies its deterministic fixture + navigation overrides, runs
 * any scripted DOM actions (tab clicks / scrolling), then marks the document
 * ready for screenshotting via `data-capture-ready="true"`.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/shell/app-shell"
import { BootSplash } from "@/components/boot/boot-splash"
import { CharacterCreation } from "@/components/onboarding/character-creation"
import { PhoneStage } from "@/components/phone/phone-stage"
import { resolveFixture, CAPTURE_NOW } from "@/lib/figma-capture-fixtures"
import type { CaptureState } from "@/lib/figma-capture-registry"
import { CAPTURE_VIEWPORT } from "@/lib/figma-capture-registry"

let determinismInstalled = false

/** Freeze randomness and the clock so captures are byte-stable between runs. */
function installDeterminism() {
  if (determinismInstalled) return
  determinismInstalled = true
  // Seeded LCG replacing Math.random.
  let s = 0x9e3779b9 >>> 0
  Math.random = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0xffffffff
  }
  // Freeze the wall clock used for relative timestamps.
  try {
    Date.now = () => CAPTURE_NOW
  } catch {
    /* noop */
  }
}

function findScrollContainer(root: HTMLElement): HTMLElement | null {
  const all = root.querySelectorAll<HTMLElement>("*")
  let best: HTMLElement | null = null
  let bestHeight = 0
  all.forEach((el) => {
    const style = getComputedStyle(el)
    const oy = style.overflowY
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 4) {
      if (el.scrollHeight > bestHeight) {
        bestHeight = el.scrollHeight
        best = el
      }
    }
  })
  return best
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"))
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true })
            img.addEventListener("error", () => resolve(), { once: true })
          }),
    ),
  )
}

function clickByText(root: HTMLElement, text: string, nth = 0) {
  const target = text.trim().toLowerCase()
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>('button, [role="tab"], [role="button"], a'),
  ).filter((el) => (el.textContent ?? "").trim().toLowerCase().includes(target))
  const el = candidates[nth] ?? candidates[0]
  if (el) el.click()
}

export function CaptureFrame({ entry, showInfo = true }: { entry: CaptureState; showInfo?: boolean }) {
  const [applied, setApplied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Apply the fixture BEFORE the target mounts so it never reads stale state.
  useLayoutEffect(() => {
    installDeterminism()
    const fixture = resolveFixture(entry.fixture)
    useEsroStore.setState(fixture())
    if (entry.state) {
      useEsroStore.setState(entry.state as Partial<ReturnType<typeof useEsroStore.getState>>)
    }
    setApplied(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.slug])

  // After mount: run actions, settle, then flag ready.
  useEffect(() => {
    if (!applied) return
    let cancelled = false
    document.documentElement.removeAttribute("data-capture-ready")

    async function run() {
      const root = rootRef.current
      if (!root) return

      // Scripted DOM actions (tab clicks, scrolling, waits).
      for (const action of entry.actions ?? []) {
        if (cancelled) return
        if ("clickText" in action) {
          clickByText(root, action.clickText, action.nth ?? 0)
          await wait(140)
        } else if ("scroll" in action) {
          applyScroll(root, action.scroll)
          await wait(80)
        } else if ("wait" in action) {
          await wait(action.wait)
        }
      }

      // Final scroll position from the entry (after actions).
      if (entry.scroll) {
        applyScroll(root, entry.scroll)
        await wait(80)
      }

      // Wait for fonts + images, then two frames to settle layout.
      try {
        await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
      } catch {
        /* noop */
      }
      await waitForImages(root)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )
      if (cancelled) return
      document.documentElement.setAttribute("data-capture-ready", "true")
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, entry.slug])

  if (!applied) return null

  const isPhoneStage = entry.render === "phone-stage"

  return (
    <div className="figma-capture-root" ref={rootRef}>
      {isPhoneStage ? (
        <div id="capture-target" className="inline-block">
          <PhoneStage />
        </div>
      ) : (
        <div
          id="capture-target"
          className="relative overflow-hidden bg-[var(--color-bg)]"
          style={{ width: CAPTURE_VIEWPORT.width, height: CAPTURE_VIEWPORT.height }}
        >
          <ThemeProvider>
            <div className="phone-screen scanlines vignette relative h-full w-full">
              {renderTarget(entry)}
            </div>
          </ThemeProvider>
        </div>
      )}

      {showInfo && (
        <div className="mt-4 max-w-[464px] text-[12px] leading-relaxed text-[#9a8fc0]">
          <div className="font-mono text-[#c9bdf5]">{entry.filename}</div>
          <div className="mt-1">{entry.description}</div>
          <div className="mt-1 text-[#6f6592]">
            {entry.source} · {CAPTURE_VIEWPORT.width}×{CAPTURE_VIEWPORT.height} @{CAPTURE_VIEWPORT.deviceScaleFactor}x
            {entry.scroll ? ` · scroll: ${entry.scroll}` : ""}
          </div>
        </div>
      )}
    </div>
  )
}

function applyScroll(root: HTMLElement, pos: "top" | "middle" | "bottom") {
  const container = findScrollContainer(root)
  if (!container) return
  const max = container.scrollHeight - container.clientHeight
  container.scrollTop = pos === "top" ? 0 : pos === "middle" ? Math.floor(max / 2) : max
}

function renderTarget(entry: CaptureState) {
  switch (entry.render) {
    case "boot":
      return <BootSplash />
    case "character-creation":
      return <CharacterCreation onComplete={() => {}} />
    default:
      return <AppShell />
  }
}
