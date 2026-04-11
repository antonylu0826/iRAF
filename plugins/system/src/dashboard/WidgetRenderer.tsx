import React, { useEffect, useState } from "react"
import { PluginRegistry } from "@iraf/react"
import type { IWidgetProps } from "@iraf/dashboard"
import { resolveWidgetData } from "./resolveWidgetData"

interface WidgetRendererProps {
  widget: IWidgetProps["widget"]
  editMode?: boolean
  onConfigure?: () => void
}

export function WidgetRenderer({ widget, editMode, onConfigure }: WidgetRendererProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(undefined)

    resolveWidgetData(widget.dataSource)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e?.message ?? "Failed to load data") })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [widget.dataSource])

  const plugin = PluginRegistry.resolve("widget", widget.widgetType)
  if (!plugin) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        Unknown widget: {widget.widgetType}
      </div>
    )
  }

  const Comp = plugin.component as React.ComponentType<IWidgetProps>
  return (
    <Comp
      widget={widget}
      data={data}
      loading={loading}
      error={error}
      editMode={editMode}
      onConfigure={onConfigure}
    />
  )
}
