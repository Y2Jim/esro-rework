#!/usr/bin/env node
/**
 * Guards against the "Maximum update depth exceeded" class of bug.
 *
 * Zustand selectors run on every store change and their result is compared by
 * reference. The store's get* helpers (getPlayerStats, getDerivedStats,
 * getAttunement, ...) build a fresh object or array per call, so selecting
 * their *result* hands useSyncExternalStore a new snapshot every time and React
 * spins forever ("The result of getSnapshot should be cached").
 *
 * The safe patterns are:
 *   const get = useEsroStore((s) => s.getPlayerStats)  // stable fn reference
 *   const stats = get()                                // call during render
 * or selecting a primitive off the result:
 *   const luck = useEsroStore((s) => s.getPlayerStats().luck)
 *
 * This flags only the unsafe form: a selector returning the whole result of a
 * call. Run: node scripts/verify-store-selectors.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = ["components", "app", "lib", "store"]
const files = []
for (const root of ROOTS) {
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx?$/.test(full)) files.push(full)
    }
  }
  walk(root)
}

// useEsroStore((s) => s.getThing())  -- with nothing after the closing paren.
// A trailing .prop (e.g. .luck) is safe, so require the call to end the selector.
const UNSAFE = /useEsroStore\(\s*\(\s*\w+\s*\)\s*=>\s*\w+\.(\w+)\(\s*\)\s*\)/g

const problems = []
for (const file of files) {
  const src = readFileSync(file, "utf8")
  for (const m of src.matchAll(UNSAFE)) {
    const line = src.slice(0, m.index).split("\n").length
    problems.push({ file, line, getter: m[1], snippet: m[0] })
  }
}

if (problems.length) {
  console.error(`FAIL: ${problems.length} unstable store selector(s) found.\n`)
  for (const p of problems) {
    console.error(`  ${p.file}:${p.line}  ${p.snippet}`)
    console.error(
      `    ${p.getter}() allocates a new value per call. Select the getter instead:\n` +
        `      const ${p.getter} = useEsroStore((s) => s.${p.getter})\n` +
        `      const value = ${p.getter}()\n`,
    )
  }
  process.exit(1)
}

console.log(`OK: scanned ${files.length} files, no unstable store selectors.`)
