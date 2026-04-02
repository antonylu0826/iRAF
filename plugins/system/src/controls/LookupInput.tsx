import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import {
  cn,
  type IControlProps,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@iraf/react"
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { resolveRefLabelField } from "../utils/refLabel"
import { resolveLabel } from "../utils/refLabelCache"

const inputClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"

const PAGE_SIZE = 20

// ─── LookupInput ─────────────────────────────────────────────────────────────

type Mode = "loading" | "select" | "lookup"

/**
 * LookupInput — 供 `ref` 欄位使用的關聯選取 control。
 *
 * - mount 時 fetch threshold+1 筆：≤ threshold → <select>；> threshold → Modal lookup
 * - Modal 支援即時搜尋 + 分頁
 */
export function LookupInput({ value, onChange, disabled, field }: IControlProps) {
  const threshold = field.refThreshold ?? 25
  const entityClass = useMemo(() => EntityRegistry.getByKey(field.ref!), [field.ref])
  const labelField = useMemo(
    () => (entityClass ? resolveRefLabelField(entityClass, field.refLabel) : "id"),
    [entityClass, field.refLabel]
  )

  const [mode, setMode] = useState<Mode>("loading")
  const [selectOptions, setSelectOptions] = useState<any[]>([])
  const [selectedLabel, setSelectedLabel] = useState("")

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [modalRows, setModalRows] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Determine mode on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!entityClass) { setMode("select"); return }
    remult.repo(entityClass as any)
      .find({ limit: threshold + 1 } as any)
      .then((records: any[]) => {
        if (records.length <= threshold) {
          setSelectOptions(records)
          setMode("select")
        } else {
          setMode("lookup")
        }
      })
      .catch(() => setMode("select"))
  }, [entityClass, threshold])

  // ─── Resolve label for current value ─────────────────────────────────────
  useEffect(() => {
    if (!value) { setSelectedLabel(""); return }
    if (mode === "select") {
      const opt = selectOptions.find((o) => String(o.id) === String(value))
      setSelectedLabel(opt ? String(opt[labelField] ?? value) : String(value))
      return
    }
    if (mode === "lookup" && entityClass) {
      resolveLabel(entityClass, value, field.refLabel)
        .then(setSelectedLabel)
        .catch(() => setSelectedLabel(String(value)))
    }
  }, [value, mode, selectOptions, entityClass, labelField])

  // ─── Load modal rows ──────────────────────────────────────────────────────
  const loadModal = useCallback(
    async (q: string, p: number) => {
      if (!entityClass) return
      setModalLoading(true)
      try {
        const where = q ? { [labelField]: { $contains: q } } : undefined
        const records: any[] = await remult.repo(entityClass as any).find({
          limit: PAGE_SIZE + 1,
          page: p,
          where,
        } as any)
        setHasMore(records.length > PAGE_SIZE)
        setModalRows(records.slice(0, PAGE_SIZE))
      } catch {
        setModalRows([])
      } finally {
        setModalLoading(false)
      }
    },
    [entityClass, labelField]
  )

  const openModal = () => {
    setSearch("")
    setPage(1)
    setModalOpen(true)
    loadModal("", 1)
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadModal(q, 1), 300)
  }

  const handlePageChange = (next: number) => {
    setPage(next)
    loadModal(search, next)
  }

  const handleSelect = (row: any) => {
    onChange(row.id)
    setModalOpen(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (mode === "loading") {
    return (
      <div className="h-9 flex items-center gap-2 text-muted-foreground text-sm px-2.5">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中…
      </div>
    )
  }

  if (mode === "select") {
    // 當筆數不超過 threshold 時退化為下拉選單，並採用統一樣式的 UI
    return (
      <Select
        value={value ? String(value) : "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder="— 請選擇 —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">— 請選擇 —</span>
          </SelectItem>
          {selectOptions.map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {String(opt[labelField] ?? opt.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // lookup mode
  return (
    <>
      <div className="flex gap-2">
        <input
          type="text"
          className={cn(inputClass, "flex-1 cursor-default")}
          value={selectedLabel}
          readOnly
          placeholder="— 未選取 —"
          onClick={!disabled ? openModal : undefined}
        />
        {!disabled && (
          <>
            <button
              type="button"
              onClick={openModal}
              title="搜尋"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted text-muted-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-background rounded-xl shadow-2xl w-[480px] max-h-[70vh] flex flex-col border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-semibold">選擇{field.caption ?? ""}</span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="搜尋…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  載入中…
                </div>
              ) : modalRows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">查無資料</div>
              ) : (
                modalRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => handleSelect(row)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-b-0",
                      String(row.id) === String(value) && "bg-primary/10 font-medium"
                    )}
                  >
                    {String(row[labelField] ?? row.id)}
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-muted-foreground">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="flex items-center gap-1 disabled:opacity-40 hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> 上一頁
                </button>
                <span>第 {page} 頁</span>
                <button
                  type="button"
                  disabled={!hasMore}
                  onClick={() => handlePageChange(page + 1)}
                  className="flex items-center gap-1 disabled:opacity-40 hover:text-foreground transition-colors"
                >
                  下一頁 <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
