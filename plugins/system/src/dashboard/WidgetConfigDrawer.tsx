/**
 * WidgetConfigDrawer — right-side slide-in panel for creating or editing a widget.
 */
import React, { useEffect, useState } from "react"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { PluginRegistry } from "@iraf/react"
import { DashboardWidget } from "@iraf/dashboard"
import type { IWidgetDataSource } from "@iraf/dashboard"
import { X, Loader2 } from "lucide-react"
import { cn } from "@iraf/react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface WidgetConfigDrawerProps {
  open: boolean
  onClose: () => void
  dashboardId: string
  /** Existing widget for edit mode; undefined for create mode */
  widget?: DashboardWidget
  /** Current widgets (for computing default grid position) */
  existingWidgets: DashboardWidget[]
  onSaved: () => void
}

interface FormState {
  widgetType: string
  title: string
  subtitle: string
  dataSource: IWidgetDataSource
  config: Record<string, any>
}

const DEFAULT_FORM: FormState = {
  widgetType: "kpi-card",
  title: "",
  subtitle: "",
  dataSource: { type: "entity" },
  config: {},
}

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

// ─── WidgetConfigDrawer ───────────────────────────────────────────────────────

export function WidgetConfigDrawer({
  open,
  onClose,
  dashboardId,
  widget,
  existingWidgets,
  onSaved,
}: WidgetConfigDrawerProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Available widget types from PluginRegistry
  const widgetPlugins = PluginRegistry.getAll("widget")

  // Available entities from EntityRegistry
  const entities = EntityRegistry.getAllWithMeta().map(({ meta }) => ({
    key: meta.key,
    caption: meta.caption ?? meta.key,
  }))

  // Fields of selected entity
  const [entityFields, setEntityFields] = useState<{ name: string; caption: string }[]>([])

  useEffect(() => {
    if (widget) {
      setForm({
        widgetType: widget.widgetType,
        title: widget.title,
        subtitle: widget.subtitle,
        dataSource: { ...widget.dataSource },
        config: { ...widget.config },
      })
    } else {
      setForm({ ...DEFAULT_FORM })
    }
    setError(null)
  }, [widget, open])

  // Update field list when entity changes
  useEffect(() => {
    const key = form.dataSource.entityKey
    if (!key) { setEntityFields([]); return }
    const entityClass = EntityRegistry.getByKey(key)
    if (!entityClass) { setEntityFields([]); return }
    const meta = EntityRegistry.getFieldMeta(entityClass)
    setEntityFields(
      Object.entries(meta).map(([name, f]) => ({ name, caption: (f.caption ?? name) as string }))
    )
  }, [form.dataSource.entityKey])

  function setDs(patch: Partial<IWidgetDataSource>) {
    setForm(f => ({ ...f, dataSource: { ...f.dataSource, ...patch } }))
  }

  function setConfig(patch: Record<string, any>) {
    setForm(f => ({ ...f, config: { ...f.config, ...patch } }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const repo = remult.repo(DashboardWidget)
      if (widget) {
        await repo.update(widget.id, {
          widgetType: form.widgetType,
          title: form.title,
          subtitle: form.subtitle,
          dataSource: form.dataSource,
          config: form.config,
        } as any)
      } else {
        // Compute next available row
        const maxRow = existingWidgets.reduce((m, w) => Math.max(m, w.gridY + w.gridH), 0)
        const newWidget = repo.create()
        Object.assign(newWidget, {
          dashboardId,
          widgetType: form.widgetType,
          title: form.title,
          subtitle: form.subtitle,
          gridX: 0,
          gridY: maxRow,
          gridW: DEFAULT_GRID_W[form.widgetType] ?? 4,
          gridH: DEFAULT_GRID_H[form.widgetType] ?? 2,
          order: existingWidgets.length,
          dataSource: form.dataSource,
          config: form.config,
        })
        await repo.insert(newWidget)
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.message ?? "儲存失敗")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[420px] bg-background border-l shadow-xl flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h3 className="text-sm font-semibold">{widget ? "編輯 Widget" : "新增 Widget"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Widget type */}
          <div>
            <label className={labelClass}>Widget 類型</label>
            <select
              className={selectClass}
              value={form.widgetType}
              onChange={e => setForm(f => ({ ...f, widgetType: e.target.value, config: {} }))}
            >
              {widgetPlugins.map(p => (
                <option key={p.name} value={p.name}>{p.caption}</option>
              ))}
            </select>
          </div>

          {/* Title / subtitle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>標題</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Widget 標題"
              />
            </div>
            <div>
              <label className={labelClass}>副標題</label>
              <input
                className={inputClass}
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="選填"
              />
            </div>
          </div>

          {/* Data source */}
          <DataSourceSection
            form={form}
            entities={entities}
            entityFields={entityFields}
            setDs={setDs}
          />

          {/* Widget-specific config */}
          <WidgetConfigSection
            widgetType={form.widgetType}
            config={form.config}
            entityFields={entityFields}
            setConfig={setConfig}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 space-y-2">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-input hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              儲存
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Default grid sizes per widget type ──────────────────────────────────────

const DEFAULT_GRID_W: Record<string, number> = {
  "kpi-card": 3,
  "bar-chart": 6,
  "line-chart": 6,
  "pie-chart": 4,
  "data-table": 8,
  "markdown": 4,
}

const DEFAULT_GRID_H: Record<string, number> = {
  "kpi-card": 2,
  "bar-chart": 3,
  "line-chart": 3,
  "pie-chart": 3,
  "data-table": 4,
  "markdown": 3,
}

// ─── DataSourceSection ────────────────────────────────────────────────────────

interface DSProps {
  form: FormState
  entities: { key: string; caption: string }[]
  entityFields: { name: string; caption: string }[]
  setDs: (patch: Partial<IWidgetDataSource>) => void
}

function DataSourceSection({ form, entities, entityFields, setDs }: DSProps) {
  const ds = form.dataSource

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-foreground border-b pb-1">資料來源</div>

      <div>
        <label className={labelClass}>來源類型</label>
        <select
          className={selectClass}
          value={ds.type}
          onChange={e => setDs({ type: e.target.value as any })}
        >
          <option value="entity">Entity 查詢</option>
          <option value="static">靜態資料</option>
          <option value="api">API 端點</option>
        </select>
      </div>

      {ds.type === "entity" && (
        <>
          <div>
            <label className={labelClass}>Entity</label>
            <select
              className={selectClass}
              value={ds.entityKey ?? ""}
              onChange={e => setDs({ entityKey: e.target.value, aggregate: undefined })}
            >
              <option value="">— 選擇 Entity —</option>
              {entities.map(e => (
                <option key={e.key} value={e.key}>{e.caption} ({e.key})</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>聚合函數</label>
            <select
              className={selectClass}
              value={ds.aggregate?.function ?? ""}
              onChange={e => {
                if (!e.target.value) {
                  setDs({ aggregate: undefined })
                } else {
                  setDs({ aggregate: { ...ds.aggregate, function: e.target.value as any, field: ds.aggregate?.field ?? "id" } })
                }
              }}
            >
              <option value="">不聚合（回傳陣列）</option>
              <option value="count">COUNT</option>
              <option value="sum">SUM</option>
              <option value="avg">AVG</option>
              <option value="min">MIN</option>
              <option value="max">MAX</option>
            </select>
          </div>

          {ds.aggregate?.function && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>聚合欄位</label>
                <select
                  className={selectClass}
                  value={ds.aggregate?.field ?? ""}
                  onChange={e => setDs({ aggregate: { ...ds.aggregate!, field: e.target.value } })}
                >
                  <option value="id">id</option>
                  {entityFields.map(f => (
                    <option key={f.name} value={f.name}>{f.caption} ({f.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>分群欄位（選填）</label>
                <select
                  className={selectClass}
                  value={ds.aggregate?.groupBy ?? ""}
                  onChange={e => setDs({ aggregate: { ...ds.aggregate!, groupBy: e.target.value || undefined } })}
                >
                  <option value="">— 不分群 —</option>
                  {entityFields.map(f => (
                    <option key={f.name} value={f.name}>{f.caption} ({f.name})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>筆數限制</label>
            <input
              type="number"
              className={inputClass}
              value={ds.limit ?? 1000}
              onChange={e => setDs({ limit: Number(e.target.value) || 1000 })}
              min={1}
              max={10000}
            />
          </div>
        </>
      )}

      {ds.type === "static" && (
        <div>
          <label className={labelClass}>靜態內容（Markdown 或 JSON）</label>
          <textarea
            className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 min-h-[120px] resize-y"
            value={typeof ds.data === "string" ? ds.data : JSON.stringify(ds.data ?? "", null, 2)}
            onChange={e => setDs({ data: e.target.value })}
            placeholder="## 標題&#10;&#10;內容…"
          />
        </div>
      )}

      {ds.type === "api" && (
        <>
          <div>
            <label className={labelClass}>URL</label>
            <input
              className={inputClass}
              value={ds.url ?? ""}
              onChange={e => setDs({ url: e.target.value })}
              placeholder="/api/my-endpoint"
            />
          </div>
          <div>
            <label className={labelClass}>Method</label>
            <select
              className={selectClass}
              value={ds.method ?? "GET"}
              onChange={e => setDs({ method: e.target.value as any })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
        </>
      )}
    </div>
  )
}

// ─── WidgetConfigSection ──────────────────────────────────────────────────────

interface ConfigProps {
  widgetType: string
  config: Record<string, any>
  entityFields: { name: string; caption: string }[]
  setConfig: (patch: Record<string, any>) => void
}

function WidgetConfigSection({ widgetType, config, entityFields, setConfig }: ConfigProps) {
  const fieldOptions = entityFields.map(f => (
    <option key={f.name} value={f.name}>{f.caption} ({f.name})</option>
  ))

  const sectionTitle = (
    <div className="text-xs font-semibold text-foreground border-b pb-1">Widget 設定</div>
  )

  if (widgetType === "kpi-card") {
    return (
      <div className="space-y-3">
        {sectionTitle}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>格式</label>
            <select className={selectClass} value={config.format ?? "number"} onChange={e => setConfig({ format: e.target.value })}>
              <option value="number">數字</option>
              <option value="currency">金額</option>
              <option value="percent">百分比</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>顏色</label>
            <select className={selectClass} value={config.color ?? "blue"} onChange={e => setConfig({ color: e.target.value })}>
              <option value="blue">藍色</option>
              <option value="green">綠色</option>
              <option value="red">紅色</option>
              <option value="orange">橘色</option>
              <option value="purple">紫色</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>前綴</label>
            <input className={inputClass} value={config.prefix ?? ""} onChange={e => setConfig({ prefix: e.target.value })} placeholder="例如 $" />
          </div>
          <div>
            <label className={labelClass}>後綴</label>
            <input className={inputClass} value={config.suffix ?? ""} onChange={e => setConfig({ suffix: e.target.value })} placeholder="例如 筆" />
          </div>
        </div>
      </div>
    )
  }

  if (widgetType === "bar-chart") {
    return (
      <div className="space-y-3">
        {sectionTitle}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>X 軸欄位</label>
            <select className={selectClass} value={config.xField ?? "group"} onChange={e => setConfig({ xField: e.target.value })}>
              <option value="group">group（分群結果）</option>
              {fieldOptions}
            </select>
          </div>
          <div>
            <label className={labelClass}>Y 軸欄位</label>
            <select className={selectClass} value={config.yField ?? "value"} onChange={e => setConfig({ yField: e.target.value })}>
              <option value="value">value（聚合結果）</option>
              {fieldOptions}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>方向</label>
          <select className={selectClass} value={config.orientation ?? "vertical"} onChange={e => setConfig({ orientation: e.target.value })}>
            <option value="vertical">垂直（直方圖）</option>
            <option value="horizontal">水平（橫條圖）</option>
          </select>
        </div>
      </div>
    )
  }

  if (widgetType === "line-chart") {
    return (
      <div className="space-y-3">
        {sectionTitle}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>X 軸欄位</label>
            <select className={selectClass} value={config.xField ?? "group"} onChange={e => setConfig({ xField: e.target.value })}>
              <option value="group">group（分群結果）</option>
              {fieldOptions}
            </select>
          </div>
          <div>
            <label className={labelClass}>Y 軸欄位</label>
            <select className={selectClass} value={config.yField ?? "value"} onChange={e => setConfig({ yField: e.target.value })}>
              <option value="value">value（聚合結果）</option>
              {fieldOptions}
            </select>
          </div>
        </div>
      </div>
    )
  }

  if (widgetType === "pie-chart") {
    return (
      <div className="space-y-3">
        {sectionTitle}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>名稱欄位</label>
            <select className={selectClass} value={config.nameField ?? "group"} onChange={e => setConfig({ nameField: e.target.value })}>
              <option value="group">group（分群結果）</option>
              {fieldOptions}
            </select>
          </div>
          <div>
            <label className={labelClass}>值欄位</label>
            <select className={selectClass} value={config.valueField ?? "value"} onChange={e => setConfig({ valueField: e.target.value })}>
              <option value="value">value（聚合結果）</option>
              {fieldOptions}
            </select>
          </div>
        </div>
      </div>
    )
  }

  if (widgetType === "data-table") {
    return (
      <div className="space-y-3">
        {sectionTitle}
        <div>
          <label className={labelClass}>每頁筆數</label>
          <input
            type="number"
            className={inputClass}
            value={config.pageSize ?? 10}
            onChange={e => setConfig({ pageSize: Number(e.target.value) || 10 })}
            min={5}
            max={100}
          />
        </div>
        {entityFields.length > 0 && (
          <div>
            <label className={labelClass}>顯示欄位（不選則顯示全部）</label>
            <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-2">
              {entityFields.map(f => {
                const cols: string[] = config.columns ?? []
                const checked = cols.includes(f.name)
                return (
                  <label key={f.name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border border-input accent-primary"
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) {
                          setConfig({ columns: [...cols, f.name] })
                        } else {
                          setConfig({ columns: cols.filter(c => c !== f.name) })
                        }
                      }}
                    />
                    <span className="text-muted-foreground">{f.caption}</span>
                    <span className="text-xs text-muted-foreground/60">({f.name})</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // markdown — no extra config needed (content is in dataSource.data)
  if (widgetType === "markdown") {
    return null
  }

  return null
}
