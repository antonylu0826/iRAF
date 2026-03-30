import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { Loader2, Save, X } from "lucide-react"

interface DetailViewProps {
  entityClass: new () => object
  id: string
}

export function DetailView({ entityClass, id }: DetailViewProps) {
  const navigate = useNavigate()
  const isNew = id === "new"
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)

  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Editable fields: not hidden, not readOnly, sorted by order
  const editableFields = Object.entries(fieldMeta)
    .filter(([, fm]) => !fm.hidden && !fm.readOnly)
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

  // Group fields
  const grouped = editableFields.reduce<Record<string, typeof editableFields>>(
    (acc, entry) => {
      const group = entry[1].group ?? ""
      if (!acc[group]) acc[group] = []
      acc[group].push(entry)
      return acc
    },
    {}
  )

  useEffect(() => {
    if (isNew) {
      const repo = remult.repo(entityClass)
      setData(repo.create() as unknown as Record<string, unknown>)
      return
    }
    setLoading(true)
    const repo = remult.repo(entityClass)
    repo
      .findId(id)
      .then((item) => {
        if (item) setData(item as unknown as Record<string, unknown>)
        else setGlobalError("找不到此筆資料")
      })
      .catch((e: unknown) => setGlobalError(String(e)))
      .finally(() => setLoading(false))
  }, [entityClass, id, isNew])

  const handleChange = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setErrors({})
    setGlobalError(null)
    try {
      const repo = remult.repo(entityClass)
      if (isNew) {
        await repo.insert(data as Partial<object>)
      } else {
        await repo.save(data as object)
      }
      navigate(`/${meta?.key}`)
    } catch (e: unknown) {
      const err = e as { modelState?: Record<string, string>; message?: string }
      if (err?.modelState) {
        setErrors(err.modelState)
      } else {
        setGlobalError(err?.message ?? String(e))
      }
    } finally {
      setSaving(false)
    }
  }

  if (!meta) return <div className="text-red-500">Entity not registered.</div>

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        載入中…
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {isNew ? `新增 ${meta.caption}` : `編輯 ${meta.caption}`}
        </h1>
      </div>

      {globalError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{globalError}</div>
      )}

      {Object.entries(grouped).map(([group, fields]) => (
        <div key={group} className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {group && (
            <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
              {group}
            </div>
          )}
          <div className="divide-y divide-gray-50">
            {fields.map(([fieldKey, fm]) => (
              <div key={fieldKey} className="flex items-start gap-4 px-4 py-3">
                <label className="w-32 shrink-0 pt-2 text-sm font-medium text-gray-600">
                  {fm.caption ?? fieldKey}
                  {fm.required && <span className="ml-1 text-red-500">*</span>}
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={String(data[fieldKey] ?? "")}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    className={`w-full rounded-md border px-3 py-1.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
                      errors[fieldKey]
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {errors[fieldKey] && (
                    <p className="mt-1 text-xs text-red-600">{errors[fieldKey]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          儲存
        </button>
        <button
          onClick={() => navigate(`/${meta.key}`)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
          取消
        </button>
      </div>
    </div>
  )
}
