// metaRouter.ts — iRAF metadata API for MCP and other tooling
//
// GET /api/iraf/meta/entities        — all entities (key, caption, fields summary)
// GET /api/iraf/meta/entities/:key   — single entity full field metadata

import { Router } from "express"
import { EntityRegistry } from "@iraf/core"

function serializeField(name: string, fm: ReturnType<typeof EntityRegistry.getFieldMeta>[string]) {
  return {
    name,
    caption: fm.caption ?? name,
    type: fm._type ?? "string",
    required: fm.required ?? false,
    hidden: typeof fm.hidden === "boolean" ? fm.hidden : false,
    readOnly: typeof fm.readOnly === "boolean" ? fm.readOnly : false,
    ...(fm.group ? { group: fm.group } : {}),
    ...(fm.order !== undefined ? { order: fm.order } : {}),
    ...(fm.options ? { options: fm.options } : {}),
    ...(fm.ref ? { ref: fm.ref, refLabel: fm.refLabel } : {}),
    ...(fm.collection ? { collection: { foreignKey: fm.collection.foreignKey } } : {}),
    ...(fm.auditField ? { auditField: true } : {}),
  }
}

export function createMetaRouter(): Router {
  const router = Router()

  /** GET /api/iraf/meta/entities — list all entities */
  router.get("/api/iraf/meta/entities", (_req, res) => {
    const list = EntityRegistry.getAllWithMeta().map(({ entityClass, meta }) => {
      const fields = EntityRegistry.getFieldMeta(entityClass)
      const actions = EntityRegistry.getActions(entityClass).map(({ controllerClass, meta: am }) => ({
        controllerClass: (controllerClass as any).name as string,
        methodName: am.methodName,
        caption: am.caption,
      }))
      return {
        key: meta.key,
        caption: meta.caption,
        icon: meta.icon,
        fields: Object.entries(fields)
          .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
          .map(([name, fm]) => serializeField(name, fm)),
        ...(actions.length > 0 ? { actions } : {}),
      }
    })
    res.json(list)
  })

  /** GET /api/iraf/meta/entities/:key — single entity detail */
  router.get("/api/iraf/meta/entities/:key", (req, res) => {
    const entry = EntityRegistry.getAllWithMeta().find((e) => e.meta.key === req.params.key)
    if (!entry) {
      res.status(404).json({ error: `Entity '${req.params.key}' not found` })
      return
    }
    const { entityClass, meta } = entry
    const fields = EntityRegistry.getFieldMeta(entityClass)
    const actions = EntityRegistry.getActions(entityClass).map(({ controllerClass, meta: am }) => ({
      controllerClass: (controllerClass as any).name as string,
      methodName: am.methodName,
      caption: am.caption,
      icon: am.icon,
      allowedRoles: am.allowedRoles,
    }))

    res.json({
      key: meta.key,
      caption: meta.caption,
      icon: meta.icon,
      defaultOrder: meta.defaultOrder,
      fields: Object.entries(fields)
        .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
        .map(([name, fm]) => serializeField(name, fm)),
      actions,
    })
  })

  return router
}
