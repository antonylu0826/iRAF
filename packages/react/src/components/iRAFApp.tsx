import React from "react"
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router"
import { EntityRegistry } from "@iraf/core"
import { AppShell } from "./AppShell"
import { ListView } from "./ListView"
import { DetailView } from "./DetailView"

interface iRAFAppProps {
  title?: string
}

export function iRAFApp({ title = "iRAF App" }: iRAFAppProps) {
  const entries = EntityRegistry.getAllWithMeta()
  const firstKey = entries[0]?.meta.key

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell title={title} />}>
          {firstKey && <Route index element={<Navigate to={`/${firstKey}`} replace />} />}
          {entries.map(({ entityClass, meta }) => {
            const EntityClass = entityClass as new () => object
            return (
              <Route key={meta.key} path={meta.key}>
                <Route index element={<ListView entityClass={EntityClass} />} />
                <Route
                  path=":id"
                  element={<RouteDetailView entityClass={EntityClass} />}
                />
              </Route>
            )
          })}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function RouteDetailView({ entityClass }: { entityClass: new () => object }) {
  const { id = "new" } = useParams<{ id: string }>()
  return <DetailView entityClass={entityClass} id={id} />
}
