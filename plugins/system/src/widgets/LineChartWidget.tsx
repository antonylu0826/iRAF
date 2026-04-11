import React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { IWidgetProps } from "@iraf/dashboard"
import { Loader2, Settings } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function LineChartWidget({ widget, data, loading, error, editMode, onConfigure }: IWidgetProps) {
  const config = widget.config
  const chartData = Array.isArray(data) ? data : []
  const xField = config.xField ?? "group"
  const yFields: string[] = config.yFields ?? [config.yField ?? "value"]
  const showLegend = config.showLegend ?? (yFields.length > 1)

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
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {yFields.map((field, i) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
