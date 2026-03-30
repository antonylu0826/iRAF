import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { Loader2, Save, X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

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

  const editableFields = Object.entries(fieldMeta)
    .filter(([, fm]) => !fm.hidden && !fm.readOnly)
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))

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

  if (!meta) return <div className="text-destructive">Entity not registered.</div>

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中…
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isNew ? `新增 ${meta.caption}` : `編輯 ${meta.caption}`}
      </h1>

      {globalError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {Object.entries(grouped).map(([group, fields]) => (
        <Card key={group}>
          {group && (
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {group}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={group ? "pt-0" : "pt-6"}>
            <div className="space-y-4">
              {fields.map(([fieldKey, fm]) => (
                <div key={fieldKey} className="grid grid-cols-4 items-start gap-4">
                  <label className="pt-2 text-sm font-medium text-right">
                    {fm.caption ?? fieldKey}
                    {fm.required && <span className="ml-1 text-destructive">*</span>}
                  </label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      value={String(data[fieldKey] ?? "")}
                      onChange={(e) => handleChange(fieldKey, e.target.value)}
                      className={errors[fieldKey] ? "border-destructive" : ""}
                    />
                    {errors[fieldKey] && (
                      <p className="text-xs text-destructive">{errors[fieldKey]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          儲存
        </Button>
        <Button variant="outline" onClick={() => navigate(`/${meta.key}`)}>
          <X className="mr-2 h-4 w-4" />
          取消
        </Button>
      </div>
    </div>
  )
}
