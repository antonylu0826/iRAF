import React from "react"
import type { IWidgetProps } from "@iraf/dashboard"
import { cn } from "@iraf/react"
import { Loader2, Settings } from "lucide-react"

const COLOR_MAP: Record<string, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
  purple: "text-purple-600 dark:text-purple-400",
}

function formatValue(value: number, config: Record<string, any>): string {
  const fmt = config.format ?? "number"
  const prefix = config.prefix ?? ""
  const suffix = config.suffix ?? ""

  let formatted: string
  switch (fmt) {
    case "currency":
      formatted = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      break
    case "percent":
      formatted = `${(value * 100).toFixed(1)}%`
      break
    default:
      formatted = value.toLocaleString()
  }

  return `${prefix}${formatted}${suffix}`
}

export function KpiCardWidget({ widget, data, loading, error, editMode, onConfigure }: IWidgetProps) {
  const color = COLOR_MAP[widget.config.color ?? "blue"] ?? COLOR_MAP.blue

  const value = typeof data === "number" ? data
    : typeof data === "object" && data !== null && "value" in data ? data.value
    : 0

  return (
    <div className="h-full flex flex-col justify-center items-center text-center p-4 relative">
      {editMode && onConfigure && (
        <button
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          onClick={onConfigure}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      )}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : (
        <>
          <div className={cn("text-3xl font-bold tracking-tight", color)}>
            {formatValue(value, widget.config)}
          </div>
          {widget.title && (
            <div className="text-sm text-muted-foreground mt-1">{widget.title}</div>
          )}
          {widget.subtitle && (
            <div className="text-xs text-muted-foreground/60">{widget.subtitle}</div>
          )}
        </>
      )}
    </div>
  )
}
