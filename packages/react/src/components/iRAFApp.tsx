import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { ModuleRegistry, EntityRegistry, ServiceRegistry, SERVICE_KEYS } from "@iraf/core"
import type { IAuthProvider } from "@iraf/core"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { AppShell } from "./AppShell"
import { LoginPage } from "./LoginPage"
import { Loader2 } from "lucide-react"
import { PluginRegistry } from "../registry/PluginRegistry"
import { initModulePlugins } from "../initModulePlugins"
import { initI18n, i18nInstance } from "../i18n/i18n"
import { initModuleI18n } from "../initModuleI18n"
import { I18nextProvider } from "react-i18next"
import { useI18n } from "../i18n/useI18n"
import { AiContextProvider, AiPanelProvider } from "./AiPanel/AiContext"

interface iRAFAppProps {
  title?: string
}

export function iRAFApp({ title = "iRAF App" }: iRAFAppProps) {
  initI18n()
  initModuleI18n()
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18nInstance}>
        <AuthProvider>
          <AiPanelProvider>
            <AppRoutes title={title} />
          </AiPanelProvider>
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  )
}

function AppRoutes({ title }: { title: string }) {
  const { user, loading } = useAuth()
  const { t } = useI18n("iraf:core")
  const modules = ModuleRegistry.getAll()

  // Register module plugins (idempotent after module use()).
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
        {t("loading")}
      </div>
    )
  }

  if (!user) {
    const authProvider = ServiceRegistry.resolve<IAuthProvider>(SERVICE_KEYS.AUTH)
    const LoginComp = (authProvider?.loginComponent as React.ComponentType | undefined) ?? LoginPage
    return <LoginComp />
  }

  return (
    <AiContextProvider>
    <Routes>
      <Route element={<AppShell title={title} />}>
        {firstPath && <Route index element={<Navigate to={firstPath} replace />} />}

        {modules.map((mod) => (
          <Route key={mod.key} path={mod.key}>
            {/* Module root route: redirect to the first entity (dashboard reserved). */}
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
    </AiContextProvider>
  )
}
