import React, { useEffect, useState } from "react"
import { remult } from "remult"
import { EntityRegistry, type ICollectionMeta, type IFieldMeta } from "@iraf/core"
import { Button, cn, PluginRegistry } from "@iraf/react"
import type { IControlProps } from "@iraf/react"
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { resolveRefLabelField } from "../utils/refLabel"

// ─── helpers ──────────────────────────────────────────────────────────────────

// ─── 格式化顯示值 ──────────────────────────────────────────────────────────────

function formatDisplay(
  value: any,
  fm: IFieldMeta,
  lookupMap?: Record<string, string>
): string {
  if (value === null || value === undefined || value === "") return "—"
  if (fm._type === "boolean") return value ? "✓" : "✗"
  if (fm._type === "date") {
    const d = value instanceof Date ? value : new Date(value)
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("zh-TW")
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

// ─── 驗證 & 錯誤解析 ───────────────────────────────────────────────────────────

/** 前端欄位驗證，回傳 fieldKey → 錯誤訊息 */
function validateRow(
  data: Record<string, any>,
  columns: [string, IFieldMeta][]
): Record<string, string> {
  const errs: Record<string, string> = {}
  for (const [key, fm] of columns) {
    const val = data[key]
    if (fm.required && (val === "" || val === null || val === undefined)) {
      errs[key] = `${fm.caption ?? key} 為必填`
    }
    if (fm.validate) {
      const msg = fm.validate(val, data)
      if (msg) errs[key] = msg
    }
  }
  return errs
}

/** 從 Remult EntityError 的 modelState 解析欄位錯誤 */
function parseApiErrors(e: any): Record<string, string> {
  return (e as any)?.modelState ?? {}
}

// ─── 解析欄位對應的 control component ─────────────────────────────────────────

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
 * SubGrid — Master-Detail 子表 control。
 *
 * 掛載於 DetailView 的 collection 欄位。
 * edit/add cells 使用 PluginRegistry controls，與 DetailView 保持一致。
 *
 * 行為分兩種模式：
 * - 已存在主記錄（edit）：新增/編輯/刪除直接對子表 API 操作，即時生效。
 * - 新建主記錄（new）：行變更透過 onChange 回傳給 DetailView；
 *   DetailView 儲存主記錄後統一批量寫入 detail。
 */
export function SubGrid({ field, entity, onChange, disabled }: IControlProps) {
  const collection = field.collection as ICollectionMeta
  const childClass = collection.entity()
  const childMeta = EntityRegistry.getMeta(childClass)
  const childFields = EntityRegistry.getFieldMeta(childClass)

  const masterId: string = (entity as any)?.id ?? ""
  const isNewMaster = !masterId

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addingRow, setAddingRow] = useState<Record<string, any> | null>(null)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Record<string, any>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  // lookupCache: fieldKey → { id → label }
  const [lookupCache, setLookupCache] = useState<Record<string, Record<string, string>>>({})

  // 顯示欄位：排除 id、foreignKey、hidden、auditField
  const columns = Object.entries(childFields)
    .filter(
      ([key, fm]) =>
        !fm.hidden &&
        !fm.auditField &&
        key !== "id" &&
        key !== collection.foreignKey
    )
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

  // ─── 載入已存在主記錄的子行 ────────────────────────────────────────────────

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

  // ─── 預先載入 ref 欄位的 label 對照表 ─────────────────────────────────────

  useEffect(() => {
    const refCols = columns.filter(([, fm]) => fm.ref)
    if (refCols.length === 0) return
    ;(async () => {
      const updates: Record<string, Record<string, string>> = {}
      for (const [key, fm] of refCols) {
        const entityClass = EntityRegistry.getByKey(fm.ref!)
        if (!entityClass) continue
        const labelField = resolveRefLabelField(entityClass, fm.refLabel)
        try {
          const records: any[] = await remult.repo(entityClass as any).find({ limit: 500 } as any)
          const map: Record<string, string> = {}
          records.forEach((r) => { map[String(r.id)] = String(r[labelField] ?? r.id) })
          updates[key] = map
        } catch { /* 忽略 */ }
      }
      setLookupCache((prev) => ({ ...prev, ...updates }))
    })()
  }, [childClass, collection.foreignKey]) // columns 是由 childFields 衍生，與 childClass 同壽命

  // ─── 新增確認 ──────────────────────────────────────────────────────────────

  const handleAddConfirm = async () => {
    if (!addingRow) return
    const errs = validateRow(addingRow, columns)
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

  // ─── 開始編輯 ─────────────────────────────────────────────────────────────

  const handleStartEdit = (row: any) => {
    setEditingKey(row.id ?? row._rowKey)
    const data: Record<string, any> = {}
    columns.forEach(([k]) => { data[k] = row[k] })
    setEditingData(data)
    setEditErrors({})
    setAddingRow(null)
    setAddErrors({})
  }

  // ─── 確認編輯 ─────────────────────────────────────────────────────────────

  const handleEditConfirm = async (row: any) => {
    const errs = validateRow(editingData, columns)
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

  // ─── 刪除一行 ─────────────────────────────────────────────────────────────

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

  // ─── 開啟新增行 ───────────────────────────────────────────────────────────

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

  // ─── 渲染 edit cell（使用 PluginRegistry control + 錯誤顯示）────────────

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

  // ─── 操作按鈕組 ──────────────────────────────────────────────────────────

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
          {childMeta?.caption ?? field.caption}
          {isNewMaster && rows.length > 0 && (
            <span className="ml-1 normal-case font-normal text-amber-600">
              · {rows.length} 筆待寫入
            </span>
          )}
        </Button>
          )
        })()}
        {!disabled && !isBusy && (
          <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={handleStartAdd}>
            <Plus className="h-3 w-3" />
            新增
          </Button>
        )}
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/10">
            {columns.map(([key, fm]) => (
              <th key={key} className="px-3 py-1.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                {fm.caption ?? key}
              </th>
            ))}
            <th className="w-16" />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length + 1} className="py-4 text-center text-muted-foreground text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />載入中…
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && !isAdding && (
            <tr>
              <td colSpan={columns.length + 1} className="py-4 text-center text-muted-foreground text-xs">
                尚無明細
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
                        {formatDisplay(row[key], fm, lookupCache[key])}
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

          {/* 新增輸入行 */}
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
