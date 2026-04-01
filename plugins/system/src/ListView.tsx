import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useAuth } from "@iraf/react"

interface ListViewProps {
  entityClass: new () => object
  viewOptions?: Record<string, any>
  /** 路由基礎路徑，例如 "/sales/customers"。由 iRAFApp 傳入 */
  basePath?: string
}

function hasRole(userRoles: string[], required?: string[]): boolean {
  if (!required || required.length === 0) return true
  return required.some((r) => userRoles.includes(r))
}

export function ListView({ entityClass, basePath }: ListViewProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const base = basePath ?? (meta ? `/${meta.key}` : "")
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)
  const canCreate = hasRole(user?.roles ?? [], meta?.allowedRoles?.create)
  const canDelete = hasRole(user?.roles ?? [], meta?.allowedRoles?.delete)
  const [rows, setRows] = useState<object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const columns = Object.entries(fieldMeta)
    .filter(([, fm]) => !fm.hidden && !fm.auditField)
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

  useEffect(() => {
    setLoading(true)
    setError(null)
    remult
      .repo(entityClass as new () => object)
      .find()
      .then((data) => setRows(data))
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [entityClass])

  const handleDelete = async (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation()
    if (!confirm("確定要刪除這筆資料嗎？")) return
    setDeletingId(id)
    try {
      await remult.repo(entityClass as new () => object).delete(id)
      setRows((prev) => prev.filter((r) => (r as any).id !== id))
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (!meta) return <div className="text-destructive">Entity not registered.</div>

  const showActions = canDelete

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{meta.caption}</h1>
        {canCreate && (
          <Button onClick={() => navigate(`${base}/new`)} size="sm">
            <Plus className="h-4 w-4" />
            新增
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          載入中…
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(([fieldKey, fm]) => (
                  <TableHead key={fieldKey}>{fm.caption ?? fieldKey}</TableHead>
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
                    尚無資料
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const id = (row as Record<string, unknown>)["id"] as string
                return (
                  <TableRow
                    key={id}
                    onClick={() => navigate(`${base}/${id}`)}
                    className="cursor-pointer"
                  >
                    {columns.map(([fieldKey, fm]) => (
                      <TableCell key={fieldKey}>
                        {fm._type === "boolean"
                          ? (row as any)[fieldKey] ? "✓" : "—"
                          : fm._type === "date" && (row as any)[fieldKey]
                          ? new Date((row as any)[fieldKey]).toLocaleDateString("zh-TW")
                          : String((row as Record<string, unknown>)[fieldKey] ?? "")}
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell
                        className="text-right"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`${base}/${id}`) }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === id}
                              onClick={(e) => handleDelete(e, id)}
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
