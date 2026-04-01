import React from "react"
import { NavLink } from "react-router"
import { ModuleRegistry, EntityRegistry, type IMenuItem, type IModuleDef } from "@iraf/core"
import * as LucideIcons from "lucide-react"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"
import { useAuth } from "../context/AuthContext"

interface SidebarProps {
  title: string
}

function isModuleVisible(mod: IModuleDef, userRoles: string[]): boolean {
  if (!mod.allowedRoles || mod.allowedRoles.length === 0) return true
  return mod.allowedRoles.some((r) => userRoles.includes(r))
}

function NavIcon({ name }: { name?: string }) {
  if (!name) return null
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name]
  if (!Icon) return null
  return <Icon size={18} className="shrink-0" />
}

function resolveMenuItem(item: IMenuItem): { caption: string; icon?: string; path: string } | null {
  if (item.type === "separator" || item.type === "link") return null

  const entityClass = item.entity
  if (!entityClass) return null

  const meta = EntityRegistry.getMeta(entityClass as Function)
  if (!meta) return null

  const moduleEntry = ModuleRegistry.findModuleByEntity(entityClass as Function)
  if (!moduleEntry) return null

  return {
    caption: item.caption ?? meta.caption,
    icon: item.icon ?? meta.icon,
    path: `/${moduleEntry.key}/${meta.key}`,
  }
}

export function Sidebar({ title }: SidebarProps) {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const modules = ModuleRegistry.getAll().filter((mod) => isModuleVisible(mod, userRoles))

  return (
    <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-full shadow-sm">
      <div className="h-14 flex items-center gap-3 px-6 border-b">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">i</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-6">
        {modules.map((mod, modIndex) => {
          const menuItems = ModuleRegistry.getMenu(mod.key)

          return (
            <div key={mod.key} className="mb-6">
              {/* 模組標題 */}
              <div className="px-6 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {mod.caption}
              </div>

              {modIndex > 0 && <Separator className="my-2 mx-6" />}

              <div className="space-y-1 px-3">
                {menuItems.map((item, itemIndex) => {
                  if (item.type === "separator") {
                    return <Separator key={`sep-${itemIndex}`} className="my-2 mx-3" />
                  }

                  if (item.type === "link") {
                    return (
                      <NavLink
                        key={item.path ?? itemIndex}
                        to={item.path ?? "#"}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )
                        }
                      >
                        <NavIcon name={item.icon} />
                        <span className="truncate">{item.caption}</span>
                      </NavLink>
                    )
                  }

                  // type: "entity"（預設）
                  const resolved = resolveMenuItem(item)
                  if (!resolved) return null

                  return (
                    <NavLink
                      key={resolved.path}
                      to={resolved.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )
                      }
                    >
                      <NavIcon name={resolved.icon} />
                      <span className="truncate">{resolved.caption}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
