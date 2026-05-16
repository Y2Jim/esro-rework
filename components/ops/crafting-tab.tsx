"use client"

import { useState, useEffect } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { CRAFTING_RECIPES, CATEGORY_CONFIG } from "@/config/crafting-recipes"
import type { CraftingCategory, CraftingRecipe } from "@/lib/types"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

const categories: CraftingCategory[] = ["food", "potion", "component", "gear", "special"]

export function CraftingTab() {
  const inventory = useEsroStore((s) => s.inventory)
  const shards = useEsroStore((s) => s.shards)
  const activeCraft = useEsroStore((s) => s.activeCraft)
  const craftItem = useEsroStore((s) => s.craftItem)
  const completeCraft = useEsroStore((s) => s.completeCraft)
  
  const [selectedCategory, setSelectedCategory] = useState<CraftingCategory>("food")
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null)
  const [craftMessage, setCraftMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const filteredRecipes = CRAFTING_RECIPES.filter(r => r.category === selectedCategory)
  const materials = inventory.filter(
    (i) => ["supply", "salvage", "herb", "mineral", "essence", "material"].includes(i.aspect)
  )

  // Check if player has ingredients for a recipe
  const canCraft = (recipe: CraftingRecipe) => {
    if (!recipe.unlocked) return false
    for (const ing of recipe.ingredients) {
      const owned = inventory.find(i => i.id === ing.itemId || i.label === ing.label)
      if (!owned || owned.qty < ing.qty) return false
    }
    return true
  }

  // Get owned quantity of ingredient
  const getOwnedQty = (itemId: string, label: string) => {
    const item = inventory.find(i => i.id === itemId || i.label === label)
    return item?.qty || 0
  }

  // Handle crafting progress
  useEffect(() => {
    if (!activeCraft) {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeCraft.startedAt
      const pct = Math.min(elapsed / activeCraft.duration, 1)
      setProgress(pct)

      if (pct >= 1) {
        completeCraft()
        setCraftMessage(`Crafted ${activeCraft.label}!`)
        setTimeout(() => setCraftMessage(null), 3000)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [activeCraft, completeCraft])

  const handleCraft = (recipe: CraftingRecipe) => {
    const result = craftItem(recipe.id)
    if (!result.success) {
      setCraftMessage(result.message)
      setTimeout(() => setCraftMessage(null), 2000)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-3">
      {/* Resources inline */}
      <div className="flex flex-wrap gap-3 text-[12px]">
        <span className="text-[color:var(--color-muted)]">
          Relay <span className="text-[color:var(--color-text)]">{shards.relay_tokens}</span>
        </span>
        <span className="text-[color:var(--color-muted)]">
          Resonance <span className="text-[color:var(--color-text)]">{shards.resonance}</span>
        </span>
        <span className="text-[color:var(--color-muted)]">
          Materials <span className="text-[color:var(--color-text)]">{materials.length}</span>
        </span>
      </div>

      {/* Active craft progress */}
      {activeCraft && (
        <div className="rounded-lg border border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[color:var(--color-amber)]">Crafting: {activeCraft.label}</span>
            <span className="text-[color:var(--color-muted)]">{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-panel)]">
            <div 
              className="h-full bg-[color:var(--color-amber)] transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Craft message */}
      {craftMessage && (
        <div className={cn(
          "rounded-lg border px-3 py-2 text-[12px]",
          craftMessage.includes("Crafted")
            ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
            : "border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]"
        )}>
          {craftMessage}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat]
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat)
                setSelectedRecipe(null)
              }}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] uppercase tracking-wider transition-colors",
                isActive
                  ? "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              )}
            >
              <span>{config.icon}</span>
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Recipe list / detail split */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        {/* Recipe list */}
        <div className="space-y-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {filteredRecipes.map((recipe) => {
            const craftable = canCraft(recipe)
            const isSelected = selectedRecipe?.id === recipe.id
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => setSelectedRecipe(recipe)}
                disabled={!recipe.unlocked}
                className={cn(
                  "w-full rounded-lg border p-2 text-left transition-all",
                  isSelected
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                    : recipe.unlocked
                      ? "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
                      : "border-[color:var(--color-border)]/50 opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-[12px] font-medium", rarityColor[recipe.output.rarity])}>
                    {recipe.label}
                  </span>
                  {craftable && !activeCraft && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-green)]" />
                  )}
                </div>
                {!recipe.unlocked && recipe.requiredSkill && (
                  <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
                    Requires {recipe.requiredSkill} Lv.{recipe.requiredSkillLevel}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Recipe detail */}
        <div className="overflow-y-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-2" style={{ scrollbarWidth: "thin" }}>
          {selectedRecipe ? (
            <div className="space-y-3">
              {/* Header */}
              <div>
                <h3 className={cn("text-[13px] font-bold", rarityColor[selectedRecipe.output.rarity])}>
                  {selectedRecipe.label}
                </h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[color:var(--color-muted)]">
                  {selectedRecipe.description}
                </p>
              </div>

              {/* Ingredients */}
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  Ingredients
                </div>
                <div className="space-y-1">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const owned = getOwnedQty(ing.itemId, ing.label)
                    const hasEnough = owned >= ing.qty
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-[color:var(--color-text)]">{ing.label}</span>
                        <span className={hasEnough ? "text-[color:var(--color-green)]" : "text-[color:var(--color-danger)]"}>
                          {owned}/{ing.qty}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Output */}
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  Creates
                </div>
                <div className="rounded bg-[color:var(--color-panel)] p-2">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[12px] font-medium", rarityColor[selectedRecipe.output.rarity])}>
                      {selectedRecipe.output.label}
                    </span>
                    <span className="text-[11px] text-[color:var(--color-muted)]">
                      x{selectedRecipe.output.qty}
                    </span>
                  </div>
                  {selectedRecipe.output.effects && (
                    <div className="mt-1 space-y-0.5">
                      {selectedRecipe.output.effects.map((effect, idx) => (
                        <div key={idx} className="text-[10px] text-[color:var(--color-green)]">
                          {effect}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Craft time */}
              <div className="text-[10px] text-[color:var(--color-muted)]">
                Craft time: {selectedRecipe.craftTime}s
              </div>

              {/* Craft button */}
              <button
                type="button"
                onClick={() => handleCraft(selectedRecipe)}
                disabled={!canCraft(selectedRecipe) || !!activeCraft}
                className={cn(
                  "w-full rounded border py-2 text-[12px] font-medium transition-colors",
                  canCraft(selectedRecipe) && !activeCraft
                    ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/15 text-[color:var(--color-green)] hover:bg-[color:var(--color-green)]/25"
                    : "border-[color:var(--color-border)] text-[color:var(--color-muted)] opacity-50"
                )}
              >
                {activeCraft ? "Crafting..." : canCraft(selectedRecipe) ? "Craft" : "Missing Materials"}
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-[color:var(--color-muted)]">
              Select a recipe
            </div>
          )}
        </div>
      </div>

      {/* Materials preview */}
      <div>
        <div className="mb-1 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Your Materials ({materials.length})
        </div>
        {materials.length === 0 ? (
          <div className="text-[12px] text-[color:var(--color-muted)]">
            No materials. Complete expeditions to gather resources.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {materials.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[10px]"
                title={item.description}
              >
                <span className={rarityColor[item.rarity]}>{item.label}</span>
                <span className="ml-1 text-[color:var(--color-muted)]">x{item.qty}</span>
              </div>
            ))}
            {materials.length > 12 && (
              <div className="rounded border border-[color:var(--color-border)]/50 px-1.5 py-0.5 text-[10px] text-[color:var(--color-muted)]">
                +{materials.length - 12} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
