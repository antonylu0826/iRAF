import React from "react"
import { NavLink } from "react-router"
import { EntityRegistry, type IEntityMeta } from "@iraf/core"
import * as LucideIcons from "lucide-react"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"

interface SidebarProps {
  title: string
}

function NavIcon({ name }: { name?: string }) {
  if (!name) return null
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name]
  if (!Icon) return null
  return <Icon size={18} className="shrink-0" />
}

type NavEntry = { entityClass: Function; meta: IEntityMeta }

export function Sidebar({ title }: SidebarProps) {
  const entries = EntityRegistry.getAllWithMeta()

  const grouped = entries.reduce<Record<string, NavEntry[]>>((acc, entry) => {
    const group = entry.meta.module ?? ""
    if (!acc[group]) acc[group] = []
    acc[group].push(entry)
    return acc
  }, {})

  return (
    <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-full shadow-sm">
      <div className="h-14 flex items-center gap-3 px-6 border-b">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">i</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-6">
        {Object.entries(grouped).map(([module, items], index) => (
          <div key={module} className="mb-6">
            {module && (
              <div className="px-6 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {module}
              </div>
            )}
            {index > 0 && !module && <Separator className="my-4 mx-6" />}
            <div className="space-y-1 px-3">
              {items.map((entry) => (
                <NavLink
                  key={entry.meta.key}
                  to={`/${entry.meta.key}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <NavIcon name={entry.meta.icon} />
                  <span className="truncate">{entry.meta.caption}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
