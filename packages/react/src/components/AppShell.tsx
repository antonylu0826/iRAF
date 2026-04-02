import React, { useEffect, useState } from "react"
import { Outlet } from "react-router"
import { LogOut, Menu } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { SlotArea } from "./SlotArea"
import { useAuth } from "../context/AuthContext"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return isDesktop
}

function AppHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8"
          aria-label="切換側邊欄"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      {user && (
        <div className="flex items-center gap-4 ml-auto">
          {/* appbar slot — logout 左側 */}
          <SlotArea prefix="appbar" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold tracking-tight">{user.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase opacity-70">{user.roles[0] ?? "user"}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 gap-2 text-muted-foreground hover:bg-muted transition-colors px-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold text-xs text-foreground/80">登出</span>
          </Button>
        </div>
      )}
    </header>
  )
}

export function AppShell({ title }: { title: string }) {
  const isDesktop = useIsDesktop()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  const toggleSidebar = () => {
    if (isDesktop) {
      setSidebarOpen((v) => !v)
    } else {
      setMobileOpen((v) => !v)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {isDesktop ? (
        sidebarOpen && <Sidebar title={title} />
      ) : (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/40 transition-opacity",
              mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar title={title} onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6 md:p-10">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
