import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { useAuth } from "../context/AuthContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"

interface ListViewProps {
  entityClass: new () => object
}

function hasRole(userRoles: string[], required?: string[]): boolean {
  if (!required || required.length === 0) return true
  return required.some((r) => userRoles.includes(r))
}

export function ListView({ entityClass }: ListViewProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)
  const canCreate = hasRole(user?.roles ?? [], meta?.allowedRoles?.create)
  const [rows, setRows] = useState<object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const columns = Object.entries(fieldMeta)
    .filter(([, fm]) => !fm.hidden)
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

  useEffect(() => {
    setLoading(true)
    setError(null)
    const repo = remult.repo(entityClass as new () => object)
    repo
      .find()
      .then((data) => setRows(data))
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [entityClass])

  if (!meta) return <div className="text-destructive">Entity not registered.</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{meta.caption}</h1>
        {canCreate && (
          <Button onClick={() => navigate(`/${meta.key}/new`)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
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
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
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
                    onClick={() => navigate(`/${meta.key}/${id}`)}
                    className="cursor-pointer"
                  >
                    {columns.map(([fieldKey]) => (
                      <TableCell key={fieldKey}>
                        {String((row as Record<string, unknown>)[fieldKey] ?? "")}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      編輯
                    </TableCell>
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
