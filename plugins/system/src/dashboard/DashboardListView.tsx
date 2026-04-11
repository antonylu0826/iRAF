import React, { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { Dashboard, DashboardWidget } from "@iraf/dashboard"
import { EventBus, evalRoleCheck } from "@iraf/core"
import { Plus, LayoutDashboard, Loader2, Trash2 } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button, useAuth } from "@iraf/react"

export function DashboardListView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboards, setDashboards] = useState<(Dashboard & { widgetCount?: number })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await remult.repo(Dashboard).find({
        orderBy: { order: "asc" },
      })
      // Count widgets per dashboard
      const withCounts = await Promise.all(
        all.map(async d => ({
          ...d,
          widgetCount: await remult.repo(DashboardWidget).count({ dashboardId: d.id }),
        })),
      )
      setDashboards(withCounts)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Refresh on AI writes
  useEffect(() => {
    return EventBus.on("ai:data-changed", ({ entityKey }: { entityKey: string }) => {
      if (entityKey === "dashboards" || entityKey === "dashboard-widgets") load()
    })
  }, [load])

  const isAdmin = user?.roles?.includes("admins") ?? false

  const handleCreate = async () => {
    const repo = remult.repo(Dashboard)
    const created = await repo.insert({
      name: "新 Dashboard",
      isPublic: true,
    } as any)
    navigate(`/dashboards/${created.id}`)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("確定要刪除此 Dashboard？")) return
    // Delete widgets first
    const widgets = await remult.repo(DashboardWidget).find({ where: { dashboardId: id } })
    for (const w of widgets) {
      await remult.repo(DashboardWidget).delete(w)
    }
    await remult.repo(Dashboard).delete(id)
    setDashboards(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboards</h2>
          <p className="text-sm text-muted-foreground">查看資料視覺化儀表板</p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" /> 新增
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-8">
          <Loader2 className="h-4 w-4 animate-spin" /> 載入中...
        </div>
      ) : dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <LayoutDashboard className="h-8 w-8 opacity-40" />
          <span>尚無 Dashboard</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboards.map(d => {
            const IconComp = d.icon
              ? ((LucideIcons as any)[d.icon] ?? LayoutDashboard)
              : LayoutDashboard

            return (
              <div
                key={d.id}
                className="group border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all bg-card"
                onClick={() => navigate(`/dashboards/${d.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <IconComp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{d.name}</div>
                      {d.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {d.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={e => handleDelete(e, d.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{d.widgetCount ?? 0} widgets</span>
                  {d.isPublic && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      公開
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
