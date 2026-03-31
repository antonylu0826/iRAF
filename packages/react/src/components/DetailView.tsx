import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { Loader2, Save, X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"
import { useAuth } from "../context/AuthContext"

function hasRole(userRoles: string[], required?: string[]): boolean {
  if (!required || required.length === 0) return true
  return required.some((r) => userRoles.includes(r))
}

interface DetailViewProps {
  entityClass: new () => object
  id: string
}

export function DetailView({ entityClass, id }: DetailViewProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = id === "new"
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)
  const allowedRoles = meta?.allowedRoles
  const canSave = isNew
    ? hasRole(user?.roles ?? [], allowedRoles?.create)
    : hasRole(user?.roles ?? [], allowedRoles?.update)

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

      <div className="space-y-12">
        {Object.entries(grouped).map(([group, fields]) => (
          <section key={group} className="space-y-6">
            {group && (
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold tracking-tight">{group}</h2>
                <Separator />
              </div>
            )}
            <div className="grid gap-x-8 gap-y-6">
              {fields.map(([fieldKey, fm]) => (
                <div
                  key={fieldKey}
                  className="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4"
                >
                  <label className="text-sm font-medium pt-2 md:text-right text-muted-foreground uppercase tracking-wider text-[10px]">
                    {fm.caption ?? fieldKey}
                    {fm.required && <span className="ml-1 text-destructive">*</span>}
                  </label>
                  <div className="md:col-span-3 space-y-1.5">
                    <Input
                      value={String(data[fieldKey] ?? "")}
                      onChange={(e) => handleChange(fieldKey, e.target.value)}
                      className={cn(
                        "h-9 focus-visible:ring-1",
                        errors[fieldKey] ? "border-destructive ring-destructive/20" : ""
                      )}
                    />
                    {errors[fieldKey] && (
                      <p className="text-[12px] font-medium text-destructive">
                        {errors[fieldKey]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Separator />

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving || !canSave}>
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
