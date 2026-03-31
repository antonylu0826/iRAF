import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { EntityRegistry } from "@iraf/core"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { AppShell } from "./AppShell"
import { LoginPage } from "./LoginPage"
import { Loader2 } from "lucide-react"
import { PluginRegistry } from "../registry/PluginRegistry"
import { initPlugins } from "../initPlugins"

// 框架啟動時登記內建插件（idempotent）
initPlugins()

interface iRAFAppProps {
  title?: string
}

export function iRAFApp({ title = "iRAF App" }: iRAFAppProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes title={title} />
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppRoutes({ title }: { title: string }) {
  const { user, loading } = useAuth()
  const entries = EntityRegistry.getAllWithMeta()
  const firstKey = entries[0]?.meta.key

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        載入中…
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route element={<AppShell title={title} />}>
        {firstKey && <Route index element={<Navigate to={`/${firstKey}`} replace />} />}
        {entries.map(({ entityClass, meta }) => {
          const EntityClass = entityClass as new () => object

          const listPlugin = PluginRegistry.resolve("list-view", meta.defaultListView ?? "list")
            ?? PluginRegistry.resolveDefault("list-view", "*")
          const detailPlugin = PluginRegistry.resolveDefault("detail-view", "*")

          const ListComp = listPlugin?.component as React.ComponentType<any> | undefined
          const DetailComp = detailPlugin?.component as React.ComponentType<any> | undefined

          if (!ListComp || !DetailComp) return null

          return (
            <Route key={meta.key} path={meta.key}>
              <Route index element={<ListComp entityClass={EntityClass} viewOptions={meta.viewOptions} />} />
              <Route path=":id" element={<DetailComp entityClass={EntityClass} viewOptions={meta.viewOptions} />} />
            </Route>
          )
        })}
      </Route>
    </Routes>
  )
}
