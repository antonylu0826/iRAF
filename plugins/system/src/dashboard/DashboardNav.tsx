import React, { useEffect, useState } from "react"
import { NavLink } from "react-router"
import { remult } from "remult"
import { Dashboard } from "@iraf/dashboard"
import { LayoutDashboard } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { cn, type ISlotProps } from "@iraf/react"
import { Separator } from "@iraf/react"

export function DashboardNav(_props: ISlotProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])

  useEffect(() => {
    remult.repo(Dashboard).find({
      orderBy: { order: "asc" },
      limit: 20,
    })
      .then(setDashboards)
      .catch(() => {})
  }, [])

  if (dashboards.length === 0) return null

  return (
    <div className="mb-2">
      <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-70">
        Dashboards
      </div>
      <div className="space-y-0.5 px-3">
        {dashboards.map(d => {
          const Icon = d.icon
            ? ((LucideIcons as any)[d.icon] ?? LayoutDashboard)
            : LayoutDashboard
          return (
            <NavLink
              key={d.id}
              to={`/dashboards/${d.id}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{d.name}</span>
            </NavLink>
          )
        })}
      </div>
      <Separator className="mt-3 mx-6" />
    </div>
  )
}
