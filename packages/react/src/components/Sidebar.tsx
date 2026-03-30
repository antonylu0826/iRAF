import React from "react"
import { NavLink } from "react-router"
import { EntityRegistry, type IEntityMeta } from "@iraf/core"
import * as LucideIcons from "lucide-react"

interface SidebarProps {
  title: string
}

function NavIcon({ name }: { name?: string }) {
  if (!name) return null
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name]
  if (!Icon) return null
  return <Icon size={16} className="shrink-0" />
}

type NavEntry = { entityClass: Function; meta: IEntityMeta }

export function Sidebar({ title }: SidebarProps) {
  const entries = EntityRegistry.getAllWithMeta()

  // Group by module
  const grouped = entries.reduce<Record<string, NavEntry[]>>((acc, entry) => {
    const group = entry.meta.module ?? ""
    if (!acc[group]) acc[group] = []
    acc[group].push(entry)
    return acc
  }, {})

  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 flex flex-col h-full">
      <div className="px-4 py-4 text-lg font-semibold border-b border-gray-700 truncate">
        {title}
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(grouped).map(([module, items]) => (
          <div key={module} className="mb-2">
            {module && (
              <div className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {module}
              </div>
            )}
            {items.map((entry) => (
              <NavLink
                key={entry.meta.key}
                to={`/${entry.meta.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <NavIcon name={entry.meta.icon} />
                {entry.meta.caption}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
