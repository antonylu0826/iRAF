import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry, EventBus, EVENTS, evalRoleCheck, ModuleRegistry } from "@iraf/core"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useAuth, SlotArea, useI18n, translateError, cn } from "@iraf/react"
import { prefetchLabels } from "./utils/refLabelCache"

interface ListViewProps {
  entityClass: new () => object
  viewOptions?: Record<string, any>
  /** Base route path, e.g. "/sales/customers". Provided by iRAFApp. */
  basePath?: string
}


export function ListView({ entityClass, basePath }: ListViewProps) {
  const navigate = useNavigate()
  const { t, i18n } = useI18n("iraf:core")
  const { user } = useAuth()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const base = basePath ?? (meta ? `/${meta.key}` : "")
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)
  const moduleKey = ModuleRegistry.findModuleByEntity(entityClass as unknown as Function)?.key
  const moduleNs = moduleKey ? `iraf:module:${moduleKey}` : undefined
  const tModule = (key?: string, fallback?: string) =>
    key ? t(key, { ns: moduleNs, defaultValue: fallback ?? key }) : (fallback ?? "")
  const canCreate = evalRoleCheck(meta?.allowedRoles?.create, user)
  // Row-level checks (evaluated per row in render)
  const canDeleteRow = (row: object) => evalRoleCheck(meta?.allowedRoles?.delete, user, row)
  const canEditRow = (row: object) => evalRoleCheck(meta?.allowedRoles?.update, user, row)
  const [rows, setRows] = useState<object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // ref column label cache: { [fieldKey]: { [id]: label } }
  const [refLabels, setRefLabels] = useState<Record<string, Record<string, string>>>({})

  const columns = Object.entries(fieldMeta)
    .filter(([, fm]) => !fm.hidden && !fm.auditField)
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

  // Whether any row-level action column should appear
  const showActions = rows.some((r) => canDeleteRow(r) || canEditRow(r)) || rows.length === 0

  useEffect(() => {
    setLoading(true)
    setError(null)
    remult
      .repo(entityClass as new () => object)
      .find()
      .then((data) => setRows(data))
      .catch((e: any) => setError(e))
      .finally(() => setLoading(false))
  }, [entityClass])

  // Batch-fetch labels for all ref columns whenever rows change
  useEffect(() => {
    const refCols = columns.filter(([, fm]) => fm.ref)
    if (refCols.length === 0 || rows.length === 0) return
    async function fetchRefLabels() {
      const result: Record<string, Record<string, string>> = {}
      for (const [colKey, fm] of refCols) {
        const refClass = EntityRegistry.getByKey(fm.ref!)
        if (!refClass) continue
        const ids = [...new Set((rows as any[]).map((r) => r[colKey]).filter(Boolean))]
        if (ids.length === 0) continue
        const map = await prefetchLabels(refClass, ids, fm.refLabel)
        result[colKey] = map
      }
      setRefLabels(result)
    }
    fetchRefLabels()
  }, [rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm(t("confirmDelete"))) return
    setDeletingId(id)
    try {
      await EventBus.emit(EVENTS.ENTITY_DELETING, { entityClass, id })
      await remult.repo(entityClass as new () => object).delete(id)
      await EventBus.emit(EVENTS.ENTITY_DELETED, { entityClass, id })
      setRows((prev) => prev.filter((r) => (r as any).id !== id))
    } catch (err: unknown) {
      setError((err as any)?.message ?? String(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (!meta) return <div className="text-destructive">Entity not registered.</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tModule(meta.caption, meta.caption)}
        </h1>
        <div className="flex items-center gap-2">
          {/* list-toolbar slot — left of add button */}
          <SlotArea prefix="list-toolbar" context={{ entityClass, meta }} />
          {canCreate && (
            <Button onClick={() => navigate(`${base}/new`)} size="sm">
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
      )}

      {Boolean(error) && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {translateError(t, error)}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(([fieldKey, fm]) => (
                  <TableHead key={fieldKey}>
                    {tModule(fm.caption, fm.caption ?? fieldKey)}
                  </TableHead>
                ))}
                {showActions && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const id = (row as Record<string, unknown>)["id"] as string
                const rowCanEdit = canEditRow(row)
                const rowCanDelete = canDeleteRow(row)
                return (
                  <TableRow
                    key={id}
                    onClick={() => navigate(`${base}/${id}`)}
                    className="cursor-pointer"
                  >
                    {columns.map(([fieldKey, fm]) => {
                      const raw = (row as any)[fieldKey]
                      let cell: React.ReactNode

                      if (fm.control === "progress") {
                        const percent = Math.min(100, Math.max(0, Number(raw) || 0))
                        const color = fm.progressColor || "bg-primary"
                        const isTailwind = color.startsWith("bg-") || color.startsWith("text-")
                        cell = (
                          <div className="flex items-center gap-2 min-w-[100px] group">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-700",
                                  isTailwind ? color : "bg-primary"
                                )}
                                style={{
                                  width: `${percent}%`,
                                  ...(!isTailwind ? { backgroundColor: color } : {})
                                }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums text-muted-foreground w-6 text-right group-hover:text-foreground transition-colors">
                              {percent}
                            </span>
                          </div>
                        )
                      } else if (fm._type === "boolean") {
                        cell = raw ? "✓" : "—"
                      } else if (fm._type === "date" && raw) {
                        cell = new Date(raw).toLocaleDateString(i18n.language)
                      } else if (fm.ref) {
                        cell = refLabels[fieldKey]?.[String(raw)] ?? String(raw ?? "")
                      } else {
                        cell = String(raw ?? "")
                      }
                      return <TableCell key={fieldKey}>{cell}</TableCell>
                    })}
                    {showActions && (
                      <TableCell
                        className="text-right"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {rowCanEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`${base}/${id}`) }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {rowCanDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === id}
                              onClick={(e: React.MouseEvent) => handleDelete(e, id)}
                            >
                              {deletingId === id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
