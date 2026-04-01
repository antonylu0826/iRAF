/**
 * RolesInput — multi-select control for user role assignment.
 * Reads available roles from ModuleRegistry.getAllRoles().
 * Renders as a checkbox group.
 */
import React from "react"
import { ModuleRegistry } from "@iraf/core"
import { cn, type IControlProps } from "@iraf/react"

export function RolesInput({ value, onChange, disabled }: IControlProps) {
  const allRoles = ModuleRegistry.getAllRoles()
  const selected: string[] = Array.isArray(value) ? value : []

  function toggle(role: string) {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role))
    } else {
      onChange([...selected, role])
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2 py-1", disabled && "opacity-50 pointer-events-none")}>
      {allRoles.map((role) => (
        <label
          key={role}
          className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
        >
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border border-input accent-primary"
            checked={selected.includes(role)}
            disabled={disabled}
            onChange={() => toggle(role)}
          />
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {role}
          </span>
        </label>
      ))}
      {allRoles.length === 0 && (
        <span className="text-xs text-muted-foreground">尚無可用角色</span>
      )}
    </div>
  )
}
