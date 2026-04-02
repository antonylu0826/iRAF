import React from "react"
import { PluginRegistry } from "../registry/PluginRegistry"

/**
 * ISlotProps — props passed to all slot components.
 * context is provided by the Shell to offer page-level context.
 */
export interface ISlotProps {
  context?: Record<string, any>
}

/**
 * SlotArea — renders all slot plugins for a given prefix.
 *
 * Slots are stored under the PluginRegistry "slot" category,
 * named as `{area}:{name}`, e.g. `appbar:notifications`.
 *
 * ```tsx
 * // Use inside Shell
 * <SlotArea prefix="appbar" />
 * <SlotArea prefix="detail-toolbar" context={{ entityClass, item }} />
 *
 * // Register a slot
 * PluginRegistry.register("slot", {
 *   name: "appbar:notifications",
 *   caption: "Notification Bell",
 *   component: NotificationBell,
 * })
 * ```
 *
 * Slot prefix guidelines:
 * - `appbar`          Right side of AppHeader (left of logout)
 * - `sidebar-header`  Below the Sidebar logo
 * - `sidebar-footer`  Bottom of Sidebar
 * - `list-toolbar`    Right side of ListView header (left of add button)
 * - `detail-header`   Right side of DetailView header (left of back button)
 * - `detail-toolbar`  After the DetailView action bar
 */
export function SlotArea({
  prefix,
  context,
}: {
  prefix: string
  context?: Record<string, any>
}) {
  const slots = PluginRegistry.getAll("slot").filter((p) =>
    p.name.startsWith(`${prefix}:`)
  )
  if (slots.length === 0) return null

  return (
    <>
      {slots.map((slot) => {
        const Comp = slot.component as React.ComponentType<ISlotProps>
        return <Comp key={slot.name} context={context} />
      })}
    </>
  )
}
