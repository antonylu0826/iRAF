/**
 * PermissionPicker — control for editing IPermissionEntry[] values.
 * Supports selecting both roles and individual users.
 */
import React, { useState, useEffect, useRef } from "react"
import { remult } from "remult"
import { ModuleRegistry, EntityRegistry } from "@iraf/core"
import type { IControlProps } from "@iraf/react"
import { cn } from "@iraf/react"
import { Plus, X, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import type { IPermissionEntry } from "@iraf/dashboard"

const PAGE_SIZE = 20

export function PermissionPicker({ value, onChange, disabled }: IControlProps) {
  const entries: IPermissionEntry[] = Array.isArray(value) ? value : []
  const allRoles = ModuleRegistry.getAllRoles()
  const availableRoles = allRoles.filter(r => !entries.some(e => e.type === "role" && e.value === r))

  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const roleMenuRef = useRef<HTMLDivElement>(null)

  // Close role menu on outside click
  useEffect(() => {
    if (!showRoleMenu) return
    function handleClick(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showRoleMenu])

  function addRole(role: string) {
    onChange([...entries, { type: "role", value: role }])
    setShowRoleMenu(false)
  }

  function addUser(user: { id: string; name: string }) {
    if (entries.some(e => e.type === "user" && e.value === user.id)) return
    onChange([...entries, { type: "user", value: user.id }])
    setShowUserModal(false)
  }

  function remove(entry: IPermissionEntry) {
    onChange(entries.filter(e => !(e.type === entry.type && e.value === entry.value)))
  }

  return (
    <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
      {/* Entries */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(e => (
            <span
              key={`${e.type}:${e.value}`}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                e.type === "role"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              )}
            >
              <span className="opacity-60">{e.type === "role" ? "🏷" : "👤"}</span>
              {e.value}
              <button
                type="button"
                onClick={() => remove(e)}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        {/* Role picker */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setShowRoleMenu(v => !v)}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-muted-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> 角色
          </button>
          {showRoleMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-background border rounded-lg shadow-lg min-w-[150px] py-1">
              {availableRoles.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">所有角色已加入</div>
              ) : (
                availableRoles.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => addRole(role)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                  >
                    {role}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* User picker */}
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-muted-foreground transition-colors"
        >
          <Plus className="h-3 w-3" /> 使用者
        </button>
      </div>

      {/* User lookup modal */}
      {showUserModal && (
        <UserPickerModal
          excludeIds={entries.filter(e => e.type === "user").map(e => e.value)}
          onSelect={addUser}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  )
}

// ─── UserPickerModal ──────────────────────────────────────────────────────────

interface UserPickerModalProps {
  excludeIds: string[]
  onSelect: (user: { id: string; name: string }) => void
  onClose: () => void
}

function UserPickerModal({ excludeIds, onSelect, onClose }: UserPickerModalProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Find users entity
  const usersEntityClass = EntityRegistry.getByKey("users")

  async function load(q: string, p: number) {
    if (!usersEntityClass) return
    setLoading(true)
    try {
      const where = q ? { name: { $contains: q } } : undefined
      const records: any[] = await remult.repo(usersEntityClass as any).find({
        limit: PAGE_SIZE + 1,
        page: p,
        where,
      } as any)
      setHasMore(records.length > PAGE_SIZE)
      setRows(records.slice(0, PAGE_SIZE))
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load("", 1) }, [])

  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(q, 1), 300)
  }

  function handlePageChange(next: number) {
    setPage(next)
    load(search, next)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background rounded-xl shadow-2xl w-[420px] max-h-[65vh] flex flex-col border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">選擇使用者</span>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="搜尋使用者…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {!usersEntityClass ? (
            <div className="py-8 text-center text-sm text-muted-foreground">找不到 users entity</div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> 載入中…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">無使用者</div>
          ) : (
            rows.map(row => {
              const alreadyAdded = excludeIds.includes(String(row.id))
              return (
                <button
                  key={row.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => onSelect({ id: String(row.id), name: String(row.name ?? row.id) })}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors",
                    alreadyAdded
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="font-medium">{row.name ?? row.id}</div>
                  {row.displayName && row.displayName !== row.name && (
                    <div className="text-xs text-muted-foreground">{row.displayName}</div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-muted-foreground">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="flex items-center gap-1 disabled:opacity-40 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> 上頁
            </button>
            <span>第 {page} 頁</span>
            <button
              type="button"
              disabled={!hasMore}
              onClick={() => handlePageChange(page + 1)}
              className="flex items-center gap-1 disabled:opacity-40 hover:text-foreground"
            >
              下頁 <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
