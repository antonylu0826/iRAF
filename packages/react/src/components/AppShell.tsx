import { Outlet } from "react-router"
import { LogOut } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { SlotArea } from "./SlotArea"
import { useAuth } from "../context/AuthContext"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"

function AppHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">

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
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar title={title} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6 md:p-10">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
