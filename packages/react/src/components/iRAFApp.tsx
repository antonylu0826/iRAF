import React from "react"
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router"
import { EntityRegistry } from "@iraf/core"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { AppShell } from "./AppShell"
import { ListView } from "./ListView"
import { DetailView } from "./DetailView"
import { LoginPage } from "./LoginPage"
import { Loader2 } from "lucide-react"

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
          return (
            <Route key={meta.key} path={meta.key}>
              <Route index element={<ListView entityClass={EntityClass} />} />
              <Route path=":id" element={<RouteDetailView entityClass={EntityClass} />} />
            </Route>
          )
        })}
      </Route>
    </Routes>
  )
}

function RouteDetailView({ entityClass }: { entityClass: new () => object }) {
  const { id = "new" } = useParams<{ id: string }>()
  return <DetailView entityClass={entityClass} id={id} />
}
