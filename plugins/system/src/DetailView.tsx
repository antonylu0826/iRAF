import React, { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry, EventBus, EVENTS, evalRoleCheck, hasRole, ModuleRegistry, type IActionMeta } from "@iraf/core"
import { ChevronLeft, Save, Loader2, X } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button, Separator, useAuth, PluginRegistry, SlotArea, cn, useI18n, translateError } from "@iraf/react"

// ─── helpers ──────────────────────────────────────────────────────────────────

function evalBool(
  value: boolean | ((entity: any) => boolean) | undefined,
  entity: any
): boolean {
  if (typeof value === "function") return value(entity)
  return value ?? false
}

// ─── DetailView ───────────────────────────────────────────────────────────────

export function DetailView({
  entityClass,
  basePath,
}: {
  entityClass: new () => object
  viewOptions?: Record<string, any>
  /** Base route path, e.g. "/sales/customers". Provided by iRAFApp. */
  basePath?: string
}) {
  const { t } = useI18n("iraf:core")
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const moduleKey = ModuleRegistry.findModuleByEntity(entityClass as unknown as Function)?.key
  const moduleNs = moduleKey ? `iraf:module:${moduleKey}` : undefined
  const tModule = (key?: string, fallback?: string) =>
    key ? t(key, { ns: moduleNs, defaultValue: fallback ?? key }) : (fallback ?? "")
  const base = basePath ?? (meta ? `/${meta.key}` : "")
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)
  const actions = EntityRegistry.getActions(entityClass as unknown as Function)

  const isNew = id === "new"
  const [item, setItem] = useState<Record<string, any>>({})
  const canSave = evalRoleCheck(
    isNew ? meta?.allowedRoles?.create : meta?.allowedRoles?.update,
    user,
    item
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<unknown>(null)
  const [drawerData, setDrawerData] = useState<{ title: string; data: any } | null>(null)

  const loadItem = useCallback(() => {
    if (isNew) {
      setItem({})
      setLoading(false)
      return
    }
    setLoading(true)
    remult
      .repo(entityClass)
      .findId(id!)
      .then((data) => {
        if (data) setItem(data as any)
        else setGlobalError({ code: "ERR_RECORD_NOT_FOUND", message: t("recordNotFound") })
      })
      .catch((e: any) => setGlobalError(e))
      .finally(() => setLoading(false))
  }, [entityClass, id, isNew])

  useEffect(() => { loadItem() }, [loadItem])

  // Refresh when AI writes to this entity
  useEffect(() => {
    if (isNew) return
    const entityMeta = EntityRegistry.getMeta(entityClass as unknown as Function)
    if (!entityMeta) return
    return EventBus.on("ai:data-changed", ({ entityKey }: { entityKey: string }) => {
      if (entityKey === entityMeta.key) loadItem()
    })
  }, [entityClass, isNew, loadItem])

  // ─── frontend validation ────────────────────────────────────────────────────
  function runValidation(): boolean {
    const errs: Record<string, string> = {}
    for (const [key, fm] of Object.entries(fieldMeta)) {
      if (fm.validate) {
        const msg = fm.validate(item[key], item)
        if (msg) errs[key] = msg
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ─── save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!runValidation()) return
    setSaving(true)
    setGlobalError(null)
    try {
      const repo = remult.repo(entityClass)

      // Separate collection fields from master data
      const collectionEntries = Object.entries(fieldMeta).filter(
        ([, fm]) => fm._type === "collection" && fm.collection
      )
      const masterData: any = { ...item }
      for (const [key] of collectionEntries) delete masterData[key]

      await EventBus.emit(EVENTS.ENTITY_SAVING, { entityClass, item, isNew })
      const saved = isNew ? await repo.insert(masterData) : await repo.save(masterData)

      // For new master: save pending detail rows collected via SubGrid onChange
      if (isNew) {
        for (const [key, fm] of collectionEntries) {
          const pendingRows: any[] = item[key] ?? []
          if (pendingRows.length === 0) continue
          const childRepo = remult.repo(fm.collection!.entity() as any)
          const payload = pendingRows.map((row) => ({
            ...row,
            [fm.collection!.foreignKey]: (saved as any).id,
          }))
          // batch insert to reduce multiple round-trips
          await childRepo.insert(payload as any)
        }
      }

      await EventBus.emit(EVENTS.ENTITY_SAVED, { entityClass, item: saved, isNew })
      navigate(base)
    } catch (e: any) {
      setGlobalError(e)
    } finally {
      setSaving(false)
    }
  }

  // ─── action ─────────────────────────────────────────────────────────────────
  const handleAction = async (
    controllerClass: Function,
    actionMeta: IActionMeta
  ) => {
    setActionLoading(actionMeta.methodName)
    setGlobalError(null)
    try {
      const result = await (controllerClass as any)[actionMeta.methodName](item.id)
      if (actionMeta.resultView === "drawer") {
        setDrawerData({ title: tModule(actionMeta.caption, actionMeta.caption), data: result })
      } else {
        const data = await remult.repo(entityClass).findId(item.id)
        if (data) setItem(data as any)
      }
    } catch (e: any) {
      console.error("[iRAF] Action failed:", e)
      setGlobalError(e)
    } finally {
      setActionLoading(null)
    }
  }

  if (!meta) return <div className="text-destructive">Entity not registered.</div>
  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    )

  // ─── field grouping (exclude hidden + auditField) ────────────────────────────
  const groupedFields: Record<string, any[]> = {}
  for (const [key, fm] of Object.entries(fieldMeta)) {
    if (fm.auditField) continue
    if (evalBool(fm.hidden, item)) continue
    const group = fm.group || t("generalInfo")
    if (!groupedFields[group]) groupedFields[group] = []
    groupedFields[group].push({ key, ...fm })
  }

  const auditEntries = Object.entries(fieldMeta).filter(([, fm]) => fm.auditField)

  const visibleActions = actions
    .filter(({ meta: am }) => hasRole(user?.roles ?? [], am.allowedRoles))
  const hasDetailToolbarSlots = PluginRegistry
    .getAll("slot")
    .some((p) => p.name.startsWith("detail-toolbar:"))

  return (
    <div className="w-full space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? t("add") : t("edit")}
            {tModule(meta.caption, meta.caption)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isNew
              ? t("detailCreateDesc", { name: tModule(meta.caption, meta.caption) })
              : t("detailEditDesc", { name: tModule(meta.caption, meta.caption) })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* detail-header slot — left of back button */}
          <SlotArea prefix="detail-header" context={{ entityClass, item, isNew }} />
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm" className="h-8">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("back")}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Action Bar + detail-toolbar slot */}
      {!isNew && (visibleActions.length > 0 || hasDetailToolbarSlots) && (
        <div className="flex flex-wrap gap-2 px-1">
          {visibleActions.map(({ controllerClass, meta: am }) => {
              const IconComp = am.icon
                ? ((LucideIcons as unknown as Record<string, React.ComponentType<any>>)[am.icon] ?? null)
                : null
              return (
                <Button
                  key={am.methodName}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(controllerClass, am)}
                >
                  {actionLoading === am.methodName ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : IconComp ? (
                    <IconComp className="mr-2 h-4 w-4" />
                  ) : null}
                  {tModule(am.caption, am.caption)}
                </Button>
              )
            })}
          {/* detail-toolbar slot — after action bar */}
          <SlotArea prefix="detail-toolbar" context={{ entityClass, item, isNew }} />
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {Boolean(globalError) && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
            {translateError(t, globalError)}
          </div>
        )}

        {/* Field groups */}
        <div className="space-y-4">
          {Object.entries(groupedFields).map(([groupName, fields]) => (
            <section key={groupName} className="space-y-2">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold tracking-tight">
                  {tModule(groupName, groupName)}
                </h3>
                <Separator />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 px-1">
                {fields
                  .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999))
                  .map((field: any) => {
                    const isReadOnly =
                      evalBool(field.readOnly, item) ||
                      (field.writeRoles && !hasRole(user?.roles ?? [], field.writeRoles))
                    return (
                      <div key={field.key} className={cn("space-y-1.5", field._type === "collection" && "col-span-full")}>
                        {field._type !== "collection" && (
                          <label className="text-[11px] font-bold leading-none text-muted-foreground uppercase tracking-tight">
                            {tModule(field.caption, field.caption ?? field.key)}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </label>
                        )}
                        {(() => {
                          const controlName =
                            field.control ??
                            (field.options ? "select" : undefined) ??
                            (field.ref ? "lookup" : undefined) ??
                            undefined
                          const plugin = controlName
                            ? PluginRegistry.resolve("control", controlName)
                            : PluginRegistry.resolveDefault("control", field._type ?? "string")
                          const ControlComponent = plugin?.component as React.ComponentType<any> | undefined
                          if (!ControlComponent) return <span className="text-xs text-muted-foreground">{t("noControl")}</span>
                          return (
                            <div className={errors[field.key] ? "ring-1 ring-destructive rounded-lg" : ""}>
                              <ControlComponent
                                value={item[field.key]}
                                onChange={(v: any) => {
                                  setItem({ ...item, [field.key]: v })
                                  if (errors[field.key]) setErrors({ ...errors, [field.key]: "" })
                                }}
                                disabled={!canSave || isReadOnly}
                                field={field}
                                entity={item}
                              />
                            </div>
                          )
                        })()}
                        {errors[field.key] && (
                          <p className="text-xs text-destructive">{errors[field.key]}</p>
                        )}
                      </div>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>

      {/* Save / Cancel */}
        <div className="pt-6 border-t flex justify-end gap-3 px-1">
          <Button type="button" variant="ghost" onClick={() => navigate(base)}>
            <X className="mr-2 h-4 w-4" />
            {t("cancel")}
          </Button>
          {canSave && (
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("save")}
            </Button>
          )}
        </div>
      </form>

      {/* Audit Info */}
      {!isNew && auditEntries.length > 0 && (
        <div className="px-1 pt-4 border-t">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-3">{t("auditInfo")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {auditEntries.map(([key, fm]) => (
              <div key={key} className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  {tModule(fm.caption, fm.caption ?? key)}
                </p>
                <p className="text-xs text-foreground/80">
                  {item[key]
                    ? item[key] instanceof Date || typeof item[key] === "string"
                      ? new Date(item[key]).toLocaleString()
                      : String(item[key])
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action result drawer */}
      {drawerData && (
        <ActionResultDrawer
          title={drawerData.title}
          data={drawerData.data}
          onClose={() => setDrawerData(null)}
        />
      )}
    </div>
  )
}

// ─── ActionResultDrawer ────────────────────────────────────────────────────────

function ActionResultDrawer({
  title,
  data,
  onClose,
}: {
  title: string
  data: any
  onClose: () => void
}) {
  // Detect AI conversation messages: array of objects with role + content
  const isMessages = Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0]?.role === "string" &&
    typeof data[0]?.content === "string"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-xl bg-background border-l shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 shrink-0 border-b">
          <span className="text-sm font-semibold">{title}</span>
          <button
            className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isMessages ? (
            <div className="space-y-3">
              {data.map((msg: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    {/* Tool calls summary */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {msg.toolCalls.map((tc: any, ti: number) => (
                          <div key={ti} className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                            🔧 {tc.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Usage */}
                    {msg.usage && (
                      <div className="mt-1 text-[10px] text-muted-foreground/60">
                        {msg.usage.model} · {msg.usage.inputTokens}↑ {msg.usage.outputTokens}↓ · {(msg.usage.durationMs / 1000).toFixed(1)}s
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/40 mt-0.5">
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/40 rounded p-3">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  )
}
