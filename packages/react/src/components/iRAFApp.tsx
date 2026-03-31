import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { ModuleRegistry, EntityRegistry } from "@iraf/core"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { AppShell } from "./AppShell"
import { LoginPage } from "./LoginPage"
import { Loader2 } from "lucide-react"
import { PluginRegistry } from "../registry/PluginRegistry"
import { initPlugins } from "../initPlugins"
import { initModulePlugins } from "../initModulePlugins"

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
  const modules = ModuleRegistry.getAll()

  // 登記模組自帶插件（模組已 use() 後，idempotent）
  initModulePlugins()
  const firstModule = modules[0]
  const firstEntityMeta = firstModule?.entities?.[0]
    ? EntityRegistry.getMeta(firstModule.entities[0])
    : undefined
  const firstPath = firstModule && firstEntityMeta
    ? `/${firstModule.key}/${firstEntityMeta.key}`
    : undefined

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
        {firstPath && <Route index element={<Navigate to={firstPath} replace />} />}

        {modules.map((mod) => (
          <Route key={mod.key} path={mod.key}>
            {/* 模組根路由：redirect 到第一個 entity（dashboard 預留） */}
            {mod.entities?.[0] && (() => {
              const firstMeta = EntityRegistry.getMeta(mod.entities![0])
              return firstMeta
                ? <Route index element={<Navigate to={`/${mod.key}/${firstMeta.key}`} replace />} />
                : null
            })()}

            {(mod.entities ?? []).map((entityClass) => {
              const EntityClass = entityClass as new () => object
              const meta = EntityRegistry.getMeta(entityClass)
              if (!meta) return null

              const basePath = `/${mod.key}/${meta.key}`

              const listPlugin = PluginRegistry.resolve("list-view", meta.defaultListView ?? "list")
                ?? PluginRegistry.resolveDefault("list-view", "*")
              const detailPlugin = PluginRegistry.resolveDefault("detail-view", "*")

              const ListComp = listPlugin?.component as React.ComponentType<any> | undefined
              const DetailComp = detailPlugin?.component as React.ComponentType<any> | undefined

              if (!ListComp || !DetailComp) return null

              return (
                <Route key={meta.key} path={meta.key}>
                  <Route index element={
                    <ListComp
                      entityClass={EntityClass}
                      basePath={basePath}
                      viewOptions={meta.viewOptions}
                    />
                  } />
                  <Route path=":id" element={
                    <DetailComp
                      entityClass={EntityClass}
                      basePath={basePath}
                      viewOptions={meta.viewOptions}
                    />
                  } />
                </Route>
              )
            })}
          </Route>
        ))}
      </Route>
    </Routes>
  )
}
