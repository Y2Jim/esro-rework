"use client"

import { useState } from "react"
import type { InventoryItem } from "@/lib/types"
import { useEsroStore } from "@/store/use-esro-store"
import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { ItemRow } from "./item-row"
import { ItemDetail } from "./item-detail"
import { AnimatePresence, motion } from "framer-motion"

type InventoryFilter = "all" | "fish" | "material" | "other"

const FILTERS: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "fish", label: "fish" },
  { id: "material", label: "materials" },
  { id: "other", label: "other" },
]

function isFish(item: InventoryItem): boolean {
  return item.type === "fish" || Boolean(item.fishCategory)
}

function isMaterial(item: InventoryItem): boolean {
  return item.aspect === "material" || item.type === "crafting_material" || item.type === "material"
}

function matchesFilter(item: InventoryItem, filter: InventoryFilter): boolean {
  if (filter === "all") return true
  if (filter === "fish") return isFish(item)
  if (filter === "material") return isMaterial(item)
  return !isFish(item) && !isMaterial(item)
}

export function InventoryScreen() {
  const inventory = useEsroStore((s) => s.inventory)
  const [filter, setFilter] = useState<InventoryFilter>("all")
  const filtered = inventory.filter((i) => matchesFilter(i, filter))
  const [selectedId, setSelectedId] = useState<string | null>(inventory[0]?.id ?? null)
  const selected = filtered.find((i) => i.id === selectedId) ?? null

  return (
    <ScreenScroll className="pb-3">
      <ScreenSection
        title="inventory"
        right={
          <span className="text-[13px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {filtered.length} packets
          </span>
        }
      >
        <div className="mb-2 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                "rounded-sm border px-2 py-1 text-[12px] uppercase tracking-[0.22em] transition-colors " +
                (filter === f.id
                  ? "border-[color:var(--color-amber-muted)]/60 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)]"
                  : "border-[color:var(--color-border-soft)] text-[color:var(--color-muted)] hover:border-[color:var(--color-border)] hover:text-[color:var(--color-lilac)]")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul className="flex flex-col gap-1">
          {filtered.map((item) => (
            <li key={item.id}>
              <ItemRow
                item={item}
                active={selectedId === item.id}
                onSelect={() =>
                  setSelectedId((cur) => (cur === item.id ? null : item.id))
                }
              />
            </li>
          ))}
        </ul>
      </ScreenSection>

      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ScreenSection title="packet detail">
              <ItemDetail item={selected} />
            </ScreenSection>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenScroll>
  )
}
