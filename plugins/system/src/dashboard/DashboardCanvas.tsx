import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { remult } from "remult"
import { Dashboard, DashboardWidget } from "@iraf/dashboard"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@iraf/react"
import { WidgetRenderer } from "./WidgetRenderer"

export function DashboardCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    Promise.all([
      remult.repo(Dashboard).findId(id),
      remult.repo(DashboardWidget).find({
        where: { dashboardId: id },
        orderBy: { order: "asc" },
      }),
    ])
      .then(([dash, ws]) => {
        if (!dash) {
          setError("Dashboard not found")
        } else {
          setDashboard(dash)
          setWidgets(ws)
        }
      })
      .catch(e => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中...
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="p-8">
        <div className="text-destructive mb-4">{error ?? "Dashboard not found"}</div>
        <Button variant="ghost" onClick={() => navigate("/dashboards")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
      </div>
    )
  }

  const columns = dashboard.columns || 12
  const gap = dashboard.gap || 16

  // Compute grid rows needed
  const maxRow = widgets.reduce((max, w) => Math.max(max, w.gridY + w.gridH), 0)

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{dashboard.name}</h2>
          {dashboard.description && (
            <p className="text-sm text-muted-foreground">{dashboard.description}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboards")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
      </div>

      {/* Grid */}
      {widgets.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          此 Dashboard 尚無任何元件
        </div>
      ) : (
        <div
          className="relative"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridAutoRows: "100px",
            gap: `${gap}px`,
          }}
        >
          {widgets.map(w => (
            <div
              key={w.id}
              className="rounded-lg border bg-card shadow-sm overflow-hidden"
              style={{
                gridColumn: `${w.gridX + 1} / span ${w.gridW}`,
                gridRow: `${w.gridY + 1} / span ${w.gridH}`,
              }}
            >
              <WidgetRenderer
                widget={{
                  id: w.id,
                  widgetType: w.widgetType,
                  title: w.title,
                  subtitle: w.subtitle,
                  dataSource: w.dataSource,
                  config: w.config,
                  gridW: w.gridW,
                  gridH: w.gridH,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
