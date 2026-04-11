import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { IWidgetProps } from "@iraf/dashboard"
import { Loader2, Settings } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

export function BarChartWidget({ widget, data, loading, error, editMode, onConfigure }: IWidgetProps) {
  const config = widget.config
  // data should be Array<{ group: string; value: number }> from grouped aggregate
  // or plain records array
  const chartData = Array.isArray(data) ? data : []

  const xField = config.xField ?? "group"
  const yField = config.yField ?? "value"
  const isHorizontal = config.orientation === "horizontal"

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
            <BarChart
              data={chartData}
              layout={isHorizontal ? "vertical" : "horizontal"}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              {isHorizontal ? (
                <>
                  <YAxis dataKey={xField} type="category" tick={{ fontSize: 11 }} width={80} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                </>
              ) : (
                <>
                  <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                </>
              )}
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey={yField} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
