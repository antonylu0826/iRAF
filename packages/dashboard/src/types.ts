// packages/dashboard/src/types.ts — Dashboard shared types

/** Permission entry: a role name or a specific user ID */
export interface IPermissionEntry {
  type: "role" | "user"
  value: string
}

/** Widget data source configuration */
export interface IWidgetDataSource {
  /** Data retrieval method */
  type: "entity" | "api" | "static"

  // type: "entity" — query from Remult entity
  entityKey?: string
  where?: Record<string, any>
  orderBy?: Record<string, "asc" | "desc">
  limit?: number
  aggregate?: IWidgetAggregate

  // type: "api" — call a custom endpoint
  url?: string
  method?: "GET" | "POST"
  body?: Record<string, any>

  // type: "static" — inline data (markdown, fixed KPI)
  data?: any
}

export interface IWidgetAggregate {
  field: string
  function: "count" | "sum" | "avg" | "min" | "max"
  groupBy?: string
}

/** Props passed to widget plugin components */
export interface IWidgetProps {
  /** Full DashboardWidget entity data */
  widget: {
    id: string
    widgetType: string
    title: string
    subtitle: string
    dataSource: IWidgetDataSource
    config: Record<string, any>
    gridW: number
    gridH: number
  }
  /** Resolved data from dataSource */
  data: any
  /** Whether data is loading */
  loading: boolean
  /** Error message if data fetch failed */
  error?: string
  /** Callback to open config drawer (edit mode) */
  onConfigure?: () => void
  /** Whether in edit mode */
  editMode?: boolean
}
