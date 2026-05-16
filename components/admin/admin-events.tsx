"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import type { EventType } from "@/lib/types"
import { cn } from "@/lib/cn"
import { Plus, Trash2, Power } from "lucide-react"

export function AdminEvents() {
  const events = useEsroStore((s) => s.events)
  const createEvent = useEsroStore((s) => s.createEvent)
  const deleteEvent = useEsroStore((s) => s.deleteEvent)
  const toggleEventActive = useEsroStore((s) => s.toggleEventActive)
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    label: "",
    description: "",
    type: "special" as EventType,
    rewards: "",
    durationDays: 7,
  })

  const handleCreate = () => {
    if (!form.label.trim()) return
    const now = Date.now()
    createEvent({
      label: form.label.trim(),
      description: form.description.trim(),
      type: form.type,
      startDate: now,
      endDate: now + form.durationDays * 24 * 60 * 60 * 1000,
      rewards: form.rewards.split(",").map((r) => r.trim()).filter(Boolean),
      active: true,
    })
    setForm({ label: "", description: "", type: "special", rewards: "", durationDays: 7 })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Game Events ({events.length})
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded border border-[#ff6b4a]/50 bg-[#ff6b4a]/10 px-2 py-1 text-[10px] uppercase tracking-wider text-[#ff6b4a] transition-colors hover:bg-[#ff6b4a]/20"
        >
          <Plus className="h-3 w-3" />
          New Event
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3 space-y-3">
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Event Name
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Summer Festival"
              className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Event description..."
              rows={2}
              className="w-full resize-none rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              >
                <option value="seasonal">Seasonal</option>
                <option value="limited">Limited</option>
                <option value="special">Special</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Duration (days)
              </label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 1 })}
                min={1}
                max={365}
                className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Rewards (comma-separated)
            </label>
            <input
              type="text"
              value={form.rewards}
              onChange={(e) => setForm({ ...form, rewards: e.target.value })}
              placeholder="Exclusive Title, Rare Cosmetic, 500 Tokens"
              className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
            />
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
              Create Event
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
          <p className="text-[11px] text-[color:var(--color-muted)]">No events created yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={cn(
                "rounded-lg border p-3",
                event.active
                  ? "border-[#60d060]/30 bg-[#60d060]/5"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-medium text-[color:var(--color-text)]">
                      {event.label}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider",
                        event.type === "seasonal" && "bg-[#5dd0ff]/20 text-[#5dd0ff]",
                        event.type === "limited" && "bg-[#ff6b4a]/20 text-[#ff6b4a]",
                        event.type === "special" && "bg-[#bb81ff]/20 text-[#bb81ff]"
                      )}
                    >
                      {event.type}
                    </span>
                    {event.active && (
                      <span className="rounded bg-[#60d060]/20 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[#60d060]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                    {event.description}
                  </p>
                  {event.rewards.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {event.rewards.map((reward, i) => (
                        <span
                          key={i}
                          className="rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 text-[9px] text-[color:var(--color-text)]"
                        >
                          {reward}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleEventActive(event.id)}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      event.active
                        ? "text-[#60d060] hover:bg-[#60d060]/20"
                        : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-border)]/50"
                    )}
                    title={event.active ? "Deactivate" : "Activate"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEvent(event.id)}
                    className="rounded p-1.5 text-[color:var(--color-muted)] transition-colors hover:bg-[#ff6b4a]/20 hover:text-[#ff6b4a]"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
