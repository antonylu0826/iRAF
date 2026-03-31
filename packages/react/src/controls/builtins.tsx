/**
 * iRAF Built-in Control Components
 *
 * 所有 built-in controls 遵循 IControlProps 介面。
 * 透過 PluginRegistry 登記後，DetailView 可依 field metadata 動態解析。
 */
import React from "react"
import { cn } from "../lib/utils"
import type { IControlProps } from "../registry/PluginRegistry"

// ─── 共用樣式 ─────────────────────────────────────────────────────────────────

const inputClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"

// ─── TextInput ────────────────────────────────────────────────────────────────

export function TextInput({ value, onChange, disabled }: IControlProps) {
  return (
    <input
      type="text"
      className={inputClass}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ─── NumberInput ──────────────────────────────────────────────────────────────

export function NumberInput({ value, onChange, disabled }: IControlProps) {
  return (
    <input
      type="number"
      className={inputClass}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === "" ? null : Number(v))
      }}
    />
  )
}

// ─── DateInput ────────────────────────────────────────────────────────────────

function toDateInputValue(v: any): string {
  if (!v) return ""
  try {
    return new Date(v).toISOString().substring(0, 10)
  } catch {
    return ""
  }
}

export function DateInput({ value, onChange, disabled }: IControlProps) {
  return (
    <input
      type="date"
      className={inputClass}
      value={toDateInputValue(value)}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
    />
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

export function Checkbox({ value, onChange, disabled, field }: IControlProps) {
  return (
    <div className="flex items-center gap-2 h-9">
      <input
        type="checkbox"
        id={`checkbox-${field.caption ?? "field"}`}
        className="h-4 w-4 rounded border border-input accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        checked={!!value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}

// ─── TextareaInput ────────────────────────────────────────────────────────────

export function TextareaInput({ value, onChange, disabled }: IControlProps) {
  return (
    <textarea
      rows={4}
      className={cn(
        "w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
      )}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ─── PasswordInput ────────────────────────────────────────────────────────────

export function PasswordInput({ value, onChange, disabled }: IControlProps) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={cn(inputClass, "pr-10")}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs select-none"
        aria-label={show ? "隱藏密碼" : "顯示密碼"}
      >
        {show ? "隱藏" : "顯示"}
      </button>
    </div>
  )
}
