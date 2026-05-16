"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import type { ContractType } from "@/lib/types"
import { cn } from "@/lib/cn"
import { Plus, Trash2 } from "lucide-react"

export function AdminContracts() {
  const contracts = useEsroStore((s) => s.contracts)
  const createContract = useEsroStore((s) => s.createContract)
  const deleteContract = useEsroStore((s) => s.deleteContract)
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    label: "",
    issuer: "",
    description: "",
    reward: "",
    type: "neutral" as ContractType,
    difficulty: "medium" as "easy" | "medium" | "hard",
  })

  const handleCreate = () => {
    if (!form.label.trim() || !form.issuer.trim()) return
    createContract({
      label: form.label.trim(),
      issuer: form.issuer.trim(),
      description: form.description.trim(),
      reward: form.reward.trim(),
      type: form.type,
      difficulty: form.difficulty,
      status: "available",
    })
    setForm({ label: "", issuer: "", description: "", reward: "", type: "neutral", difficulty: "medium" })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Contracts ({contracts.length})
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded border border-[#ff6b4a]/50 bg-[#ff6b4a]/10 px-2 py-1 text-[10px] uppercase tracking-wider text-[#ff6b4a] transition-colors hover:bg-[#ff6b4a]/20"
        >
          <Plus className="h-3 w-3" />
          New Contract
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Contract Name
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Salvage Run"
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Issuer
              </label>
              <input
                type="text"
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                placeholder="Waykeeper Guild"
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contract details..."
              rows={2}
              className="w-full resize-none rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ContractType })}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              >
                <option value="faction">Faction</option>
                <option value="neutral">Neutral</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Reward
              </label>
              <input
                type="text"
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
                placeholder="500 Tokens"
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-[color:var(--color-border)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!form.label.trim() || !form.issuer.trim()}
              className="rounded bg-[#ff6b4a] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-black disabled:opacity-50"
            >
              Create Contract
            </button>
          </div>
        </div>
      )}

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
          <p className="text-[11px] text-[color:var(--color-muted)]">No contracts available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-medium text-[color:var(--color-text)]">
                      {contract.label}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider",
                        contract.type === "faction" && "bg-[#bb81ff]/20 text-[#bb81ff]",
                        contract.type === "neutral" && "bg-[#5dd0ff]/20 text-[#5dd0ff]",
                        contract.type === "event" && "bg-[#ffb347]/20 text-[#ffb347]"
                      )}
                    >
                      {contract.type}
                    </span>
                    {contract.difficulty && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider",
                          contract.difficulty === "easy" && "bg-[#60d060]/20 text-[#60d060]",
                          contract.difficulty === "medium" && "bg-[#ffb347]/20 text-[#ffb347]",
                          contract.difficulty === "hard" && "bg-[#ff6b4a]/20 text-[#ff6b4a]"
                        )}
                      >
                        {contract.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                    {contract.issuer}
                  </p>
                  <p className="mt-1 text-[10px] text-[color:var(--color-text-secondary)]">
                    {contract.description}
                  </p>
                  {contract.reward && (
                    <p className="mt-1 text-[10px] text-[#60d060]">
                      Reward: {contract.reward}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteContract(contract.id)}
                  className="rounded p-1.5 text-[color:var(--color-muted)] transition-colors hover:bg-[#ff6b4a]/20 hover:text-[#ff6b4a]"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
