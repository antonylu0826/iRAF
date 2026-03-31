import React from "react"
import { Outlet } from "react-router"
import { LogOut } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { useAuth } from "../context/AuthContext"
import { Button } from "./ui/button"

interface AppShellProps {
  title: string
}

export function AppShell({ title }: AppShellProps) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar title={title} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 shrink-0 border-b bg-background flex items-center justify-between px-6">
          <span className="text-sm text-muted-foreground">{title}</span>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="h-8 gap-1.5 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                登出
              </Button>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
