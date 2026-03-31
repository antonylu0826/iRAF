import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { ChevronLeft, Save, Loader2, X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Separator } from "./ui/separator"
import { useAuth } from "../context/AuthContext"

function hasRole(userRoles: string[], required?: string[]): boolean {
  if (!required || required.length === 0) return true
  return required.some((r) => userRoles.includes(r))
}

export function DetailView({ entityClass }: { entityClass: new () => object }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const meta = EntityRegistry.getMeta(entityClass as unknown as Function)
  const fieldMeta = EntityRegistry.getFieldMeta(entityClass as unknown as Function)

  const isNew = id === "new"
  const canSave = hasRole(
    user?.roles ?? [],
    isNew ? meta?.allowedRoles?.create : meta?.allowedRoles?.update
  )

  const [item, setItem] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        else setError("資料不存在")
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [entityClass, id, isNew])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const repo = remult.repo(entityClass)
      if (isNew) {
        const saved = await repo.insert(item)
        navigate(`/${meta?.key}/${(saved as any).id}`, { replace: true })
      } else {
        await repo.save(item)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
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

  // 按群組整理欄位
  const groupedFields: Record<string, any[]> = {}
  Object.entries(fieldMeta).forEach(([key, fm]) => {
    if (fm.hidden) return
    const group = fm.group || "一般資訊"
    if (!groupedFields[group]) groupedFields[group] = []
    groupedFields[group].push({ key, ...fm })
  })

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? "新增" : "編輯"}{meta.caption}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isNew ? `建立一筆新的 ${meta.caption} 資料` : `修改現有的 ${meta.caption} 詳細資訊`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm" className="h-8">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSave} className="space-y-8">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedFields).map(([groupName, fields]) => (
            <section key={groupName} className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold tracking-tight">{groupName}</h3>
                <Separator />
              </div>

              {/* Grid 佈局：更緊湊的間距 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 px-1">
                {fields
                  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                  .map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[11px] font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground uppercase tracking-tight">
                        {field.caption ?? field.key}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      <Input
                        disabled={!canSave || field.readOnly}
                        value={item[field.key] ?? ""}
                        onChange={(e) => setItem({ ...item, [field.key]: e.target.value })}
                        className="h-9 bg-background focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                      />
                      {field.description && (
                        <p className="text-[0.8rem] text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>

        {/* 底部按鈕區 - 佔滿寬度 */}
        <div className="pt-6 border-t flex justify-end gap-3 px-1">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate(`/${meta.key}`)}
          >
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
              儲存 {meta.caption}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
