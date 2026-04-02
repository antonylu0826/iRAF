import React, { useEffect, useState } from "react"
import { remult } from "remult"
import { EntityRegistry, ModuleRegistry, type ICollectionMeta, type IFieldMeta } from "@iraf/core"
import { Button, cn, PluginRegistry, useI18n } from "@iraf/react"
import type { IControlProps } from "@iraf/react"
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { prefetchLabels } from "../utils/refLabelCache"

// ─── helpers ──────────────────────────────────────────────────────────────────

// ─── format display value ─────────────────────────────────────────────────────

function formatDisplay(
  value: any,
  fm: IFieldMeta,
  lookupMap?: Record<string, string>,
  locale?: string
): string {
  if (value === null || value === undefined || value === "") return "—"
  if (fm._type === "boolean") return value ? "✓" : "✗"
  if (fm._type === "date") {
    const d = value instanceof Date ? value : new Date(value)
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(locale)
  }
  if (fm.options) {
    const opt = (fm.options as any[]).find((o: any) =>
      typeof o === "string" ? o === value : o.id === value
    )
    if (opt !== undefined) return typeof opt === "string" ? opt : opt.caption
  }
  if (fm.ref && lookupMap) {
    return lookupMap[String(value)] ?? String(value)
  }
  return String(value)
}

// ─── validation & error parsing ──────────────────────────────────────────────

/** Client-side validation; returns fieldKey -> error message. */
function validateRow(
  data: Record<string, any>,
  columns: [string, IFieldMeta][],
  t: (key: string, options?: { field?: string }) => string,
  getCaption: (key?: string, fallback?: string) => string
): Record<string, string> {
  const errs: Record<string, string> = {}
  for (const [key, fm] of columns) {
    const val = data[key]
    if (fm.required && (val === "" || val === null || val === undefined)) {
      const label = getCaption(fm.caption, fm.caption ?? key)
      errs[key] = t("fieldRequired", { field: label })
    }
    if (fm.validate) {
      const msg = fm.validate(val, data)
      if (msg) errs[key] = msg
    }
  }
  return errs
}

/** Parse field errors from Remult EntityError modelState. */
function parseApiErrors(e: any): Record<string, string> {
  return (e as any)?.modelState ?? {}
}

// ─── resolve control component ───────────────────────────────────────────────

function resolveControl(fm: IFieldMeta) {
  const name =
    fm.control ??
    (fm.options ? "select" : undefined) ??
    (fm.ref ? "lookup" : undefined)
  const plugin = name
    ? PluginRegistry.resolve("control", name)
    : PluginRegistry.resolveDefault("control", fm._type ?? "string")
  return plugin?.component as React.ComponentType<IControlProps> | undefined
}

// ─── SubGrid ──────────────────────────────────────────────────────────────────

/**
 * SubGrid — master-detail subgrid control.
 *
 * Mounted on collection fields inside DetailView.
 * Edit/add cells use PluginRegistry controls to stay consistent with DetailView.
 *
 * Two modes:
 * - Existing master (edit): add/edit/delete calls child API directly.
 * - New master: row changes are passed via onChange;
 *   DetailView saves the master first, then batch-inserts details.
 */
export function SubGrid({ field, entity, onChange, disabled }: IControlProps) {
  const { t, i18n } = useI18n("iraf:core")
  const collection = field.collection as ICollectionMeta
  const childClass = collection.entity()
  const childMeta = EntityRegistry.getMeta(childClass)
  const childFields = EntityRegistry.getFieldMeta(childClass)
  const moduleKey = ModuleRegistry.findModuleByEntity(childClass as Function)?.key
  const moduleNs = moduleKey ? `iraf:module:${moduleKey}` : undefined
  const tModule = (key?: string, fallback?: string) =>
    key ? t(key, { ns: moduleNs, defaultValue: fallback ?? key }) : (fallback ?? "")

  const masterId: string = (entity as any)?.id ?? ""
  const isNewMaster = !masterId

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addingRow, setAddingRow] = useState<Record<string, any> | null>(null)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Record<string, any>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  // lookupCache: fieldKey -> { id -> label }
  const [lookupCache, setLookupCache] = useState<Record<string, Record<string, string>>>({})

  // Visible columns: exclude id, foreignKey, hidden, auditField
  const columns = Object.entries(childFields)
    .filter(
      ([key, fm]) =>
        !fm.hidden &&
        !fm.auditField &&
        key !== "id" &&
        key !== collection.foreignKey
    )
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

  // ─── Load rows for existing master ─────────────────────────────────────────

  useEffect(() => {
    if (!masterId) {
      setRows([])
      return
    }
    setLoading(true)
    remult
      .repo(childClass as any)
      .find({ where: { [collection.foreignKey]: masterId } as any })
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [masterId, childClass, collection.foreignKey])

  // ─── Prefetch ref label maps ───────────────────────────────────────────────

  useEffect(() => {
    const refCols = columns.filter(([, fm]) => fm.ref)
    if (refCols.length === 0 || rows.length === 0) return
    ;(async () => {
      const updates: Record<string, Record<string, string>> = {}
      for (const [key, fm] of refCols) {
        const entityClass = EntityRegistry.getByKey(fm.ref!)
        if (!entityClass) continue
        const ids = [...new Set(rows.map((r) => r[key]).filter(Boolean))]
        if (ids.length === 0) continue
        updates[key] = await prefetchLabels(entityClass, ids, fm.refLabel)
      }
      setLookupCache((prev) => ({ ...prev, ...updates }))
    })()
  }, [rows, columns])

  // ─── Confirm add ───────────────────────────────────────────────────────────

  const handleAddConfirm = async () => {
    if (!addingRow) return
    const errs = validateRow(addingRow, columns, t, tModule)
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return }
    setAddErrors({})

    if (masterId) {
      try {
        const inserted = await remult.repo(childClass as any).insert({
          ...addingRow,
          [collection.foreignKey]: masterId,
        })
        setRows((prev) => [...prev, inserted])
      } catch (e) {
        setAddErrors(parseApiErrors(e))
        return
      }
    } else {
      const rowKey = Math.random().toString(36).slice(2)
      const newRows = [...rows, { ...addingRow, _rowKey: rowKey }]
      setRows(newRows)
      onChange?.(newRows.map(({ _rowKey, ...r }) => r))
    }
    setAddingRow(null)
  }

  // ─── Start edit ────────────────────────────────────────────────────────────

  const handleStartEdit = (row: any) => {
    setEditingKey(row.id ?? row._rowKey)
    const data: Record<string, any> = {}
    columns.forEach(([k]) => { data[k] = row[k] })
    setEditingData(data)
    setEditErrors({})
    setAddingRow(null)
    setAddErrors({})
  }

  // ─── Confirm edit ──────────────────────────────────────────────────────────

  const handleEditConfirm = async (row: any) => {
    const errs = validateRow(editingData, columns, t, tModule)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    setEditErrors({})

    if (masterId) {
      try {
        const updated = await remult.repo(childClass as any).save({ ...row, ...editingData })
        setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)))
      } catch (e) {
        setEditErrors(parseApiErrors(e))
        return
      }
    } else {
      const newRows = rows.map((r) =>
        r._rowKey === row._rowKey ? { ...r, ...editingData } : r
      )
      setRows(newRows)
      onChange?.(newRows.map(({ _rowKey, ...r }) => r))
    }
    setEditingKey(null)
  }

  // ─── Delete row ────────────────────────────────────────────────────────────

  const handleDelete = async (row: any) => {
    if (masterId) {
      try {
        await remult.repo(childClass as any).delete(row.id)
        setRows((prev) => prev.filter((r) => r.id !== row.id))
      } catch (e) {
        console.error("[SubGrid] Delete failed:", e)
      }
    } else {
      const newRows = rows.filter((r) => r._rowKey !== row._rowKey)
      setRows(newRows)
      onChange?.(newRows.map(({ _rowKey, ...r }) => r))
    }
  }

  // ─── Open add row ─────────────────────────────────────────────────────────

  const handleStartAdd = () => {
    const empty: Record<string, any> = {}
    columns.forEach(([key, fm]) => {
      if (fm._type === "number") empty[key] = 0
      else if (fm._type === "boolean") empty[key] = false
      else empty[key] = ""
    })
    setAddingRow(empty)
    setAddErrors({})
    setEditingKey(null)
    setEditErrors({})
  }

  const isAdding = addingRow !== null
  const isBusy = isAdding || editingKey !== null

  // ─── Render edit cell (PluginRegistry control + error display) ────────────

  function renderEditCell(
    key: string,
    fm: IFieldMeta,
    value: any,
    onChangeFn: (v: any) => void,
    rowEntity: Record<string, any>,
    error?: string
  ) {
    const ControlComp = resolveControl(fm)
    if (!ControlComp) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div className={cn("space-y-0.5", error && "ring-1 ring-destructive rounded-lg")}>
        <ControlComp
          value={value}
          onChange={(v) => { onChangeFn(v); }}
          disabled={false}
          field={{ key, ...fm } as any}
          entity={rowEntity}
        />
        {error && <p className="text-[11px] text-destructive px-1">{error}</p>}
      </div>
    )
  }

  // ─── Action buttons ───────────────────────────────────────────────────────

  function renderConfirmButtons(onConfirm: () => void, onCancel: () => void) {
    return (
      <div className="flex gap-0.5 justify-end">
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onConfirm}>
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        {(() => {
          const IconComp =
            childMeta?.icon
              ? (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[childMeta.icon] ?? null
              : null
          return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-0 gap-1 text-xs font-semibold uppercase tracking-tight pointer-events-none"
        >
          {IconComp && <IconComp className="h-3.5 w-3.5" />}
          {tModule(childMeta?.caption, childMeta?.caption ?? field.caption)}
          {isNewMaster && rows.length > 0 && (
            <span className="ml-1 normal-case font-normal text-amber-600">
              · {rows.length} {t("pending")}
            </span>
          )}
        </Button>
          )
        })()}
        {!disabled && !isBusy && (
          <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={handleStartAdd}>
            <Plus className="h-3 w-3" />
            {t("add")}
          </Button>
        )}
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/10">
            {columns.map(([key, fm]) => (
              <th key={key} className="px-3 py-1.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                {tModule(fm.caption, fm.caption ?? key)}
              </th>
            ))}
            <th className="w-16" />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length + 1} className="py-4 text-center text-muted-foreground text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />{t("loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && !isAdding && (
            <tr>
              <td colSpan={columns.length + 1} className="py-4 text-center text-muted-foreground text-xs">
                {t("noDetails")}
              </td>
            </tr>
          )}

          {rows.map((row, i) => {
            const rowKey = row.id ?? row._rowKey ?? i
            const isEditingThis = editingKey === (row.id ?? row._rowKey)
            return (
              <tr
                key={rowKey}
                className={cn(
                  "border-b last:border-0",
                  isEditingThis
                    ? "bg-blue-50/40 dark:bg-blue-950/20"
                    : cn("hover:bg-muted/20", isNewMaster && "bg-amber-50/50 dark:bg-amber-950/20")
                )}
              >
                {isEditingThis ? (
                  <>
                    {columns.map(([key, fm]) => (
                      <td key={key} className="px-2 py-1 align-top">
                        {renderEditCell(
                          key, fm,
                          editingData[key],
                          (v) => {
                            setEditingData((prev) => ({ ...prev, [key]: v }))
                            if (editErrors[key]) setEditErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
                          },
                          editingData,
                          editErrors[key]
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1 align-top">
                      {renderConfirmButtons(() => handleEditConfirm(row), () => { setEditingKey(null); setEditErrors({}) })}
                    </td>
                  </>
                ) : (
                  <>
                    {columns.map(([key, fm]) => (
                      <td key={key} className="px-3 py-2 text-sm">
                        {formatDisplay(row[key], fm, lookupCache[key], i18n.language)}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right">
                      {!disabled && (
                        <div className="flex gap-0.5 justify-end">
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => handleStartEdit(row)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(row)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            )
          })}

          {/* Add input row */}
          {isAdding && (
            <tr className="border-b bg-blue-50/40 dark:bg-blue-950/20">
              {columns.map(([key, fm]) => (
                <td key={key} className="px-2 py-1 align-top">
                  {renderEditCell(
                    key, fm,
                    addingRow![key],
                    (v) => {
                      setAddingRow((prev) => ({ ...prev!, [key]: v }))
                      if (addErrors[key]) setAddErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
                    },
                    addingRow!,
                    addErrors[key]
                  )}
                </td>
              ))}
              <td className="px-2 py-1 align-top">
                {renderConfirmButtons(handleAddConfirm, () => { setAddingRow(null); setAddErrors({}) })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
