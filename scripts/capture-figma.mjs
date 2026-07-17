#!/usr/bin/env node
/**
 * FIGMA CAPTURE AUTOMATION — development tooling only.
 *
 * Drives a headless Chromium (Playwright) over every entry in the capture
 * registry and writes pixel-stable PNGs into ./figma-captures, organised by
 * category folder, plus a manifest.json describing the run.
 *
 * Usage:
 *   pnpm capture:figma                      # captures everything
 *   pnpm capture:figma -- --filter=ops      # only slugs/categories matching "ops"
 *   pnpm capture:figma -- --base=http://localhost:3001
 *   pnpm capture:figma -- --out=./exports
 *
 * Prereq: the dev server (or a production build) must be running so that
 * /figma-capture/manifest and the capture routes are reachable.
 */

import { chromium } from "playwright"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

// ---- args -------------------------------------------------------------
const args = process.argv.slice(2)
function arg(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split("=").slice(1).join("=") : fallback
}
const BASE = arg("base", process.env.CAPTURE_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
const OUT = path.resolve(process.cwd(), arg("out", "figma-captures"))
const FILTER = arg("filter", "").toLowerCase()
const CLEAN = args.includes("--clean")

// ---- helpers ----------------------------------------------------------
const log = (...m) => console.log("[capture]", ...m)

async function fetchManifest() {
  const url = `${BASE}/figma-capture/manifest`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Manifest fetch failed (${res.status}) at ${url}`)
  return res.json()
}

async function main() {
  log(`base:   ${BASE}`)
  log(`output: ${OUT}`)

  let manifest
  try {
    manifest = await fetchManifest()
  } catch (err) {
    console.error(`\n[capture] Could not reach ${BASE}.`)
    console.error("[capture] Start the dev server first (e.g. `pnpm dev`), then re-run.\n")
    throw err
  }

  const viewport = manifest.viewport ?? { width: 464, height: 936, deviceScaleFactor: 2 }
  let captures = manifest.captures ?? []
  if (FILTER) {
    captures = captures.filter(
      (c) =>
        c.slug.toLowerCase().includes(FILTER) ||
        c.category.toLowerCase().includes(FILTER) ||
        c.folder.toLowerCase().includes(FILTER),
    )
  }
  if (captures.length === 0) {
    log("No captures matched. Nothing to do.")
    return
  }
  log(`captures: ${captures.length}${FILTER ? ` (filter="${FILTER}")` : ""}`)

  if (CLEAN && existsSync(OUT)) {
    await rm(OUT, { recursive: true, force: true })
  }
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    colorScheme: "dark",
    reducedMotion: "reduce",
  })
  const page = await context.newPage()
  page.on("pageerror", (e) => console.warn("[capture] page error:", e.message))

  const results = []
  let done = 0
  for (const cap of captures) {
    const url = `${BASE}/figma-capture/${cap.slug}?capture=1`
    const folderDir = path.join(OUT, cap.folder)
    await mkdir(folderDir, { recursive: true })
    const filePath = path.join(folderDir, cap.filename)

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
      // Wait for the capture frame to signal it has settled.
      await page.waitForSelector("html[data-capture-ready='true']", { timeout: 20000 })
      const target = await page.$("#capture-target")
      if (!target) throw new Error("#capture-target not found")
      await target.screenshot({ path: filePath })
      results.push({ slug: cap.slug, folder: cap.folder, filename: cap.filename, ok: true })
      done += 1
      log(`✓ ${String(done).padStart(2, "0")}/${captures.length}  ${cap.folder}/${cap.filename}`)
    } catch (err) {
      results.push({ slug: cap.slug, folder: cap.folder, filename: cap.filename, ok: false, error: String(err.message || err) })
      log(`✗ ${cap.slug} — ${err.message || err}`)
    }
  }

  await browser.close()

  // Run manifest for the exported set.
  const runManifest = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    viewport,
    total: captures.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    categories: manifest.categories ?? [],
    captures: captures.map((c) => ({
      slug: c.slug,
      category: c.category,
      folder: c.folder,
      title: c.title,
      description: c.description,
      source: c.source,
      filename: c.filename,
      animation: c.animation ?? "none",
      notes: c.notes ?? "",
      relativePath: `${c.folder}/${c.filename}`,
    })),
    results,
  }
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(runManifest, null, 2))

  log("")
  log(`Done. ${runManifest.succeeded} ok, ${runManifest.failed} failed.`)
  log(`Manifest: ${path.join(OUT, "manifest.json")}`)
  if (runManifest.failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
