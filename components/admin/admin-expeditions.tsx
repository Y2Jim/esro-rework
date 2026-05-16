"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { Plus, Trash2 } from "lucide-react"

export function AdminExpeditions() {
  const expeditions = useEsroStore((s) => s.expeditions)
  const createExpedition = useEsroStore((s) => s.createExpedition)
  const deleteExpedition = useEsroStore((s) => s.deleteExpedition)
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    label: "",
    description: "",
    duration: 300,
    risk: "Low" as "Low" | "Medium" | "High",
    requiredSkill: "analysis",
    suggestedParty: 1,
    tags: "",
    xpReward: 100,
    tokenReward: 50,
    materials: "",
  })

  const handleCreate = () => {
    if (!form.label.trim()) return
    createExpedition({
      label: form.label.trim(),
      description: form.description.trim(),
      duration: form.duration,
      risk: form.risk,
      requiredSkill: form.requiredSkill,
      suggestedParty: form.suggestedParty,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      rewards: {
        xp: form.xpReward,
        tokens: form.tokenReward,
        materials: form.materials.split(",").map((m) => m.trim()).filter(Boolean),
      },
    })
    setForm({
      label: "",
      description: "",
      duration: 300,
      risk: "Low",
      requiredSkill: "analysis",
      suggestedParty: 1,
      tags: "",
      xpReward: 100,
      tokenReward: 50,
      materials: "",
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Expeditions ({expeditions.length})
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded border border-[#ff6b4a]/50 bg-[#ff6b4a]/10 px-2 py-1 text-[10px] uppercase tracking-wider text-[#ff6b4a] transition-colors hover:bg-[#ff6b4a]/20"
        >
          <Plus className="h-3 w-3" />
          New Expedition
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Expedition Name
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Deep Salvage Run"
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Required Skill
              </label>
              <input
                type="text"
                value={form.requiredSkill}
                onChange={(e) => setForm({ ...form, requiredSkill: e.target.value })}
                placeholder="analysis"
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
              placeholder="Expedition details..."
              rows={2}
              className="w-full resize-none rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Duration (sec)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                min={60}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Risk
              </label>
              <select
                value={form.risk}
                onChange={(e) => setForm({ ...form, risk: e.target.value as "Low" | "Medium" | "High" })}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Party Size
              </label>
              <input
                type="number"
                value={form.suggestedParty}
                onChange={(e) => setForm({ ...form, suggestedParty: parseInt(e.target.value) || 1 })}
                min={1}
                max={4}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Tags
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="salvage, deep"
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                XP Reward
              </label>
              <input
                type="number"
                value={form.xpReward}
                onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Token Reward
              </label>
              <input
                type="number"
                value={form.tokenReward}
                onChange={(e) => setForm({ ...form, tokenReward: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Materials
              </label>
              <input
                type="text"
                value={form.materials}
                onChange={(e) => setForm({ ...form, materials: e.target.value })}
                placeholder="Iron, Crystal"
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
              disabled={!form.label.trim()}
              className="rounded bg-[#ff6b4a] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-black disabled:opacity-50"
            >
              Create Expedition
            </button>
          </div>
        </div>
      )}

      {/* Expeditions List */}
      {expeditions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
          <p className="text-[11px] text-[color:var(--color-muted)]">No expeditions available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expeditions.map((exp) => (
            <div
              key={exp.id}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-medium text-[color:var(--color-text)]">
                      {exp.label}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider",
                        exp.risk === "Low" && "bg-[#60d060]/20 text-[#60d060]",
                        exp.risk === "Medium" && "bg-[#ffb347]/20 text-[#ffb347]",
                        exp.risk === "High" && "bg-[#ff6b4a]/20 text-[#ff6b4a]"
                      )}
                    >
                      {exp.risk} Risk
                    </span>
                    <span className="text-[9px] text-[color:var(--color-muted)]">
                      {Math.floor(exp.duration / 60)}m
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[color:var(--color-text-secondary)]">
                    {exp.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {exp.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 text-[8px] text-[color:var(--color-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteExpedition(exp.id)}
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
