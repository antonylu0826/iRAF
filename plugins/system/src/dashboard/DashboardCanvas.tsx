import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { remult } from "remult"
import { ModuleRegistry, EntityRegistry, EventBus } from "@iraf/core"
import { Dashboard, DashboardWidget } from "@iraf/dashboard"
import type { IPermissionEntry } from "@iraf/dashboard"
import { useAuth, cn } from "@iraf/react"
import {
  ChevronLeft, Edit2, Save, X, Plus, Settings, Trash2, Loader2, Search,
} from "lucide-react"
import { WidgetRenderer } from "./WidgetRenderer"
import { WidgetConfigDrawer } from "./WidgetConfigDrawer"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

type RGLLayout = { i: string; x: number; y: number; w: number; h: number }

const ROW_HEIGHT = 100

// ─── DashboardCanvas ──────────────────────────────────────────────────────────

export function DashboardCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<RGLLayout[]>([])
  const [layoutDirty, setLayoutDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Widget config drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | undefined>()

  // Dashboard settings panel
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ─── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [dash, ws] = await Promise.all([
        remult.repo(Dashboard).findId(id),
        remult.repo(DashboardWidget).find({
          where: { dashboardId: id },
          orderBy: { order: "asc" },
        }),
      ])
      if (!dash) {
        setError("Dashboard not found")
      } else {
        setDashboard(dash)
        setWidgets(ws)
        setLayout(ws.map(w => ({ i: w.id, x: w.gridX, y: w.gridY, w: w.gridW, h: w.gridH })))
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Auto-refresh when AI creates/updates dashboard-widgets
  useEffect(() => {
    return EventBus.on("ai:data-changed", ({ entityKey }: { entityKey: string }) => {
      if (entityKey === "dashboard-widgets" || entityKey === "dashboards") {
        if (!editMode) load()
      }
    })
  }, [load, editMode])

  // ─── Permissions ───────────────────────────────────────────────────────────

  const canEdit = Boolean(
    user && dashboard && (
      user.roles?.includes("admins") ||
      dashboard.createdBy === user.name ||
      (dashboard.editPermissions ?? []).some(p =>
        p.type === "role" ? user.roles?.includes(p.value) : p.value === user.id
      )
    )
  )

  // ─── Edit mode handlers ────────────────────────────────────────────────────

  function enterEdit() {
    setLayout(widgets.map(w => ({ i: w.id, x: w.gridX, y: w.gridY, w: w.gridW, h: w.gridH })))
    setLayoutDirty(false)
    setEditMode(true)
  }

  function cancelEdit() {
    setLayout(widgets.map(w => ({ i: w.id, x: w.gridX, y: w.gridY, w: w.gridW, h: w.gridH })))
    setLayoutDirty(false)
    setEditMode(false)
    setSettingsOpen(false)
  }

  async function saveLayout() {
    if (!layoutDirty && !settingsOpen) { setEditMode(false); return }
    setSaving(true)
    try {
      await Promise.all(
        layout.map(l => {
          const w = widgets.find(w => w.id === l.i)
          if (!w) return Promise.resolve()
          return remult.repo(DashboardWidget).update(w.id, {
            gridX: l.x, gridY: l.y, gridW: l.w, gridH: l.h,
          } as any)
        })
      )
      await load()
      setEditMode(false)
      setSettingsOpen(false)
    } catch {
      // stay in edit mode
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteWidget(widgetId: string) {
    if (!confirm("確定要刪除此 Widget？")) return
    await remult.repo(DashboardWidget).delete(widgetId)
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    setLayout(prev => prev.filter(l => l.i !== widgetId))
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> 載入中...
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="p-8">
        <div className="text-destructive mb-4">{error ?? "Dashboard not found"}</div>
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/dashboards")}
        >
          <ChevronLeft className="h-4 w-4" /> 返回
        </button>
      </div>
    )
  }

  const columns = dashboard.columns || 12
  const gap = dashboard.gap || 16

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
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={() => { setEditingWidget(undefined); setDrawerOpen(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> 加 Widget
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  settingsOpen ? "bg-muted border-input" : "border-input hover:bg-muted"
                )}
              >
                <Settings className="h-3.5 w-3.5" /> 設定
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" /> 取消
              </button>
              <button
                type="button"
                onClick={saveLayout}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Save className="h-3.5 w-3.5" />
                }
                儲存
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  type="button"
                  onClick={enterEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> 編輯
                </button>
              )}
              <button
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/dashboards")}
              >
                <ChevronLeft className="h-4 w-4" /> 返回
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dashboard settings panel */}
      {settingsOpen && (
        <DashboardSettingsPanel
          dashboard={dashboard}
          onSaved={updated => {
            setDashboard(updated)
          }}
        />
      )}

      {/* Grid */}
      {widgets.length === 0 && !editMode ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <span>此 Dashboard 尚無任何元件</span>
          {canEdit && (
            <button
              type="button"
              onClick={enterEdit}
              className="text-primary hover:underline text-xs"
            >
              點此進入編輯模式新增 Widget
            </button>
          )}
        </div>
      ) : editMode ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-2 min-h-[200px]">
          <GridLayoutWrapper
            columns={columns}
            gap={gap}
            layout={layout}
            onLayoutChange={(l) => { setLayout(l); setLayoutDirty(true) }}
          >
            {widgets.map(w => (
              <div
                key={w.id}
                className="rounded-lg border bg-card shadow-sm overflow-hidden flex flex-col"
              >
                {/* Drag handle + action buttons — dragging only starts from this bar */}
                <div className="rgl-drag-handle flex items-center justify-between px-2 py-1 border-b bg-muted/40 cursor-grab active:cursor-grabbing select-none">
                  <span className="text-xs text-muted-foreground truncate flex-1 mr-2">
                    {w.title || w.widgetType}
                  </span>
                  {/* Buttons: stop propagation so they don't trigger drag */}
                  <div
                    className="flex gap-1 shrink-0"
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="設定"
                      onClick={() => { setEditingWidget(w); setDrawerOpen(true) }}
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      title="刪除"
                      onClick={() => handleDeleteWidget(w.id)}
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {/* Widget content */}
                <div className="flex-1 overflow-hidden">
                  <WidgetRenderer
                    widget={{
                      id: w.id, widgetType: w.widgetType, title: w.title, subtitle: w.subtitle,
                      dataSource: w.dataSource, config: w.config, gridW: w.gridW, gridH: w.gridH,
                    }}
                  />
                </div>
              </div>
            ))}
          </GridLayoutWrapper>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridAutoRows: `${ROW_HEIGHT}px`,
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
                  id: w.id, widgetType: w.widgetType, title: w.title, subtitle: w.subtitle,
                  dataSource: w.dataSource, config: w.config, gridW: w.gridW, gridH: w.gridH,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Widget config drawer */}
      <WidgetConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        dashboardId={dashboard.id}
        widget={editingWidget}
        existingWidgets={widgets}
        onSaved={load}
      />
    </div>
  )
}

// ─── GridLayoutWrapper ────────────────────────────────────────────────────────

interface GridLayoutWrapperProps {
  columns: number
  gap: number
  layout: RGLLayout[]
  onLayoutChange: (layout: RGLLayout[]) => void
  children: React.ReactNode
}

function GridLayoutWrapper({ columns, gap, layout, onLayoutChange, children }: GridLayoutWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setWidth(el.offsetWidth)
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      <GridLayout
        layout={layout}
        cols={columns}
        rowHeight={ROW_HEIGHT}
        width={width}
        margin={[gap, gap]}
        compactType={null}
        preventCollision={false}
        onLayoutChange={onLayoutChange}
        isDraggable
        isResizable
        resizeHandles={["se"]}
        draggableHandle=".rgl-drag-handle"
      >
        {children}
      </GridLayout>
    </div>
  )
}

// ─── DashboardSettingsPanel ───────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

const labelCls = "block text-xs font-medium text-muted-foreground mb-1"

interface DashboardSettingsPanelProps {
  dashboard: Dashboard
  onSaved: (updated: Dashboard) => void
}

function DashboardSettingsPanel({ dashboard, onSaved }: DashboardSettingsPanelProps) {
  const [name, setName] = useState(dashboard.name)
  const [description, setDescription] = useState(dashboard.description ?? "")
  const [icon, setIcon] = useState(dashboard.icon ?? "")
  const [isPublic, setIsPublic] = useState(dashboard.isPublic ?? false)
  const [viewPermissions, setViewPermissions] = useState<IPermissionEntry[]>(dashboard.viewPermissions ?? [])
  const [editPermissions, setEditPermissions] = useState<IPermissionEntry[]>(dashboard.editPermissions ?? [])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await remult.repo(Dashboard).update(dashboard.id, {
        name, description, icon, isPublic, viewPermissions, editPermissions,
      } as any)
      onSaved(updated)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="text-sm font-semibold">Dashboard 設定</div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>名稱</label>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>圖示（Lucide icon 名稱）</label>
          <input className={inputCls} value={icon} onChange={e => setIcon(e.target.value)} placeholder="LayoutDashboard" />
        </div>
      </div>

      <div>
        <label className={labelCls}>說明</label>
        <textarea
          className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 min-h-[60px] resize-none"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="dp-public"
          className="h-3.5 w-3.5 rounded border border-input accent-primary"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
        />
        <label htmlFor="dp-public" className="text-sm cursor-pointer">公開（所有登入使用者可見）</label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>可檢視權限</label>
          <PermissionPickerMini value={viewPermissions} onChange={setViewPermissions} />
        </div>
        <div>
          <label className={labelCls}>可編輯權限</label>
          <PermissionPickerMini value={editPermissions} onChange={setEditPermissions} />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          儲存設定
        </button>
      </div>
    </div>
  )
}

// ─── PermissionPickerMini ─────────────────────────────────────────────────────

interface PPMiniProps {
  value: IPermissionEntry[]
  onChange: (v: IPermissionEntry[]) => void
}

function PermissionPickerMini({ value, onChange }: PPMiniProps) {
  const entries = value
  const allRoles = ModuleRegistry.getAllRoles()
  const availableRoles = allRoles.filter(r => !entries.some(e => e.type === "role" && e.value === r))
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showRoleMenu) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowRoleMenu(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [showRoleMenu])

  function remove(entry: IPermissionEntry) {
    onChange(entries.filter(e => !(e.type === entry.type && e.value === entry.value)))
  }

  return (
    <div className="space-y-2">
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entries.map(e => (
            <span
              key={`${e.type}:${e.value}`}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                e.type === "role"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              )}
            >
              {e.value}
              <button type="button" onClick={() => remove(e)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowRoleMenu(v => !v)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-input hover:bg-muted text-muted-foreground"
          >
            <Plus className="h-3 w-3" /> 角色
          </button>
          {showRoleMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-background border rounded-lg shadow-lg min-w-[140px] py-1">
              {availableRoles.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">已全選</div>
              ) : availableRoles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { onChange([...entries, { type: "role", value: role }]); setShowRoleMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-input hover:bg-muted text-muted-foreground"
        >
          <Plus className="h-3 w-3" /> 使用者
        </button>
      </div>
      {showUserModal && (
        <UserPickerModal
          excludeIds={entries.filter(e => e.type === "user").map(e => e.value)}
          onSelect={u => { onChange([...entries, { type: "user", value: u.id }]); setShowUserModal(false) }}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  )
}

// ─── UserPickerModal ──────────────────────────────────────────────────────────

function UserPickerModal({
  excludeIds,
  onSelect,
  onClose,
}: {
  excludeIds: string[]
  onSelect: (user: { id: string; name: string }) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usersEntityClass = EntityRegistry.getByKey("users")

  async function load(q: string) {
    if (!usersEntityClass) return
    setLoading(true)
    try {
      const where = q ? { name: { $contains: q } } : undefined
      const records: any[] = await remult.repo(usersEntityClass as any).find({ limit: 20, where } as any)
      setRows(records)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load("") }, [])

  function handleSearch(q: string) {
    setSearch(q)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => load(q), 300)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background rounded-xl shadow-2xl w-[380px] max-h-[60vh] flex flex-col border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">選擇使用者</span>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-sm outline-none"
              placeholder="搜尋使用者…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">無使用者</div>
          ) : rows.map(row => (
            <button
              key={row.id}
              type="button"
              disabled={excludeIds.includes(String(row.id))}
              onClick={() => onSelect({ id: String(row.id), name: String(row.name ?? row.id) })}
              className="w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <div className="font-medium">{row.name ?? row.id}</div>
              {row.displayName && row.displayName !== row.name && (
                <div className="text-xs text-muted-foreground">{row.displayName}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
