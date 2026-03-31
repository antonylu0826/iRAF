import React from "react"
import { Outlet } from "react-router"
import { Sidebar } from "./Sidebar"

interface AppShellProps {
  title: string
}

export function AppShell({ title }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar title={title} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 shrink-0 border-b bg-background flex items-center px-6">
          <span className="text-sm text-muted-foreground">{title}</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
