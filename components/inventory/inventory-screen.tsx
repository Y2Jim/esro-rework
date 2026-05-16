"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { ItemRow } from "./item-row"
import { ItemDetail } from "./item-detail"
import { AnimatePresence, motion } from "framer-motion"

export function InventoryScreen() {
  const inventory = useEsroStore((s) => s.inventory)
  const [selectedId, setSelectedId] = useState<string | null>(inventory[0]?.id ?? null)
  const selected = inventory.find((i) => i.id === selectedId) ?? null

  return (
    <ScreenScroll className="pb-3">
      <ScreenSection
        title="inventory"
        right={
          <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {inventory.length} packets
          </span>
        }
      >
        <ul className="flex flex-col gap-1">
          {inventory.map((item) => (
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
