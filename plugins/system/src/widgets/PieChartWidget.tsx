import React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { IWidgetProps } from "@iraf/dashboard"
import { Loader2, Settings } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]

export function PieChartWidget({ widget, data, loading, error, editMode, onConfigure }: IWidgetProps) {
  const config = widget.config
  const chartData = Array.isArray(data) ? data : []
  const nameField = config.nameField ?? "group"
  const valueField = config.valueField ?? "value"
  const showLegend = config.showLegend ?? true

  return (
    <div className="h-full flex flex-col p-3 relative">
      {editMode && onConfigure && (
        <button className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground" onClick={onConfigure}>
          <Settings className="h-3.5 w-3.5" />
        </button>
      )}

      {widget.title && <div className="text-sm font-semibold mb-2">{widget.title}</div>}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-destructive">{error}</div>
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">無資料</div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey={valueField}
                nameKey={nameField}
                cx="50%"
                cy="50%"
                outerRadius="75%"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
                style={{ fontSize: 11 }}
              >
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
