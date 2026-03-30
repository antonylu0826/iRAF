import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { Plus, Loader2 } from "lucide-react"

interface ListViewProps {
  entityClass: new () => object
}

export function ListView({ entityClass }: ListViewProps) {
  const navigate = useNavigate()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)
  const [rows, setRows] = useState<object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Visible columns: fields that are NOT hidden, sorted by order
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

  if (!meta) return <div className="text-red-500">Entity not registered.</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{meta.caption}</h1>
        <button
          onClick={() => navigate(`/${meta.key}/new`)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          新增
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          載入中…
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(([fieldKey, fm]) => (
                  <th
                    key={fieldKey}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {fm.caption ?? fieldKey}
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    尚無資料
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const id = (row as Record<string, unknown>)["id"] as string
                return (
                  <tr
                    key={id}
                    onClick={() => navigate(`/${meta.key}/${id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {columns.map(([fieldKey]) => (
                      <td key={fieldKey} className="px-4 py-3 text-sm text-gray-900">
                        {String((row as Record<string, unknown>)[fieldKey] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm text-blue-500">編輯</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
