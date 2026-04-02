import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry, EventBus, EVENTS, evalRoleCheck, hasRole, type IActionMeta } from "@iraf/core"
import { ChevronLeft, Save, Loader2, X } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button, Separator, useAuth, PluginRegistry, SlotArea, cn } from "@iraf/react"

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
  /** 路由基礎路徑，例如 "/sales/customers"。由 iRAFApp 傳入 */
  basePath?: string
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
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
  const [globalError, setGlobalError] = useState<string | null>(null)

  useEffect(() => {
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
        else setGlobalError("資料不存在")
      })
      .catch((e: any) => setGlobalError(e?.message ?? String(e)))
      .finally(() => setLoading(false))
  }, [entityClass, id, isNew])

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
          for (const row of pendingRows) {
            await childRepo.insert({ ...row, [fm.collection!.foreignKey]: (saved as any).id })
          }
        }
      }

      await EventBus.emit(EVENTS.ENTITY_SAVED, { entityClass, item: saved, isNew })
      navigate(base)
    } catch (e: any) {
      setGlobalError(e?.message ?? String(e))
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
      await (controllerClass as any)[actionMeta.methodName](item.id)
      const data = await remult.repo(entityClass).findId(item.id)
      if (data) setItem(data as any)
    } catch (e: any) {
      console.error("[iRAF] Action failed:", e)
      setGlobalError(e.message || (typeof e === "object" ? JSON.stringify(e) : String(e)))
    } finally {
      setActionLoading(null)
    }
  }

  if (!meta) return <div className="text-destructive">Entity not registered.</div>
  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中…
      </div>
    )

  // ─── field grouping (exclude hidden + auditField) ────────────────────────────
  const groupedFields: Record<string, any[]> = {}
  for (const [key, fm] of Object.entries(fieldMeta)) {
    if (fm.auditField) continue
    if (evalBool(fm.hidden, item)) continue
    const group = fm.group || "一般資訊"
    if (!groupedFields[group]) groupedFields[group] = []
    groupedFields[group].push({ key, ...fm })
  }

  const auditEntries = Object.entries(fieldMeta).filter(([, fm]) => fm.auditField)

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? "新增" : "編輯"}{meta.caption}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isNew
              ? `建立一筆新的 ${meta.caption} 資料`
              : `修改現有的 ${meta.caption} 詳細資訊`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* detail-header slot — 返回按鈕左側 */}
          <SlotArea prefix="detail-header" context={{ entityClass, item, isNew }} />
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm" className="h-8">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </div>
      </div>

      <Separator />

      {/* Action Bar + detail-toolbar slot */}
      {!isNew && (
        <div className="flex flex-wrap gap-2 px-1">
          {actions
            .filter(({ meta: am }) => hasRole(user?.roles ?? [], am.allowedRoles))
            .map(({ controllerClass, meta: am }) => {
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
                  {am.caption}
                </Button>
              )
            })}
          {/* detail-toolbar slot — Action Bar 之後 */}
          <SlotArea prefix="detail-toolbar" context={{ entityClass, item, isNew }} />
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {globalError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
            {typeof globalError === "object" ? JSON.stringify(globalError) : globalError}
          </div>
        )}

        {/* Field groups */}
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([groupName, fields]) => (
            <section key={groupName} className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold tracking-tight">{groupName}</h3>
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
                        <label className="text-[11px] font-bold leading-none text-muted-foreground uppercase tracking-tight">
                          {field.caption ?? field.key}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </label>
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
                          if (!ControlComponent) return <span className="text-xs text-muted-foreground">— 無 control —</span>
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
            取消
          </Button>
          {canSave && (
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              儲存
            </Button>
          )}
        </div>
      </form>

      {/* Audit Info */}
      {!isNew && auditEntries.length > 0 && (
        <div className="px-1 pt-4 border-t">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-3">稽核資訊</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {auditEntries.map(([key, fm]) => (
              <div key={key} className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{fm.caption ?? key}</p>
                <p className="text-xs text-foreground/80">
                  {item[key]
                    ? item[key] instanceof Date || typeof item[key] === "string"
                      ? new Date(item[key]).toLocaleString("zh-TW")
                      : String(item[key])
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
