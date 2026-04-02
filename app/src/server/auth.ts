// app/src/server/auth.ts
// Auth routes + getUser middleware — uses IAuthProvider from ServiceRegistry
import { Router } from "express"
import { remult } from "remult"
import { ServiceRegistry, SERVICE_KEYS } from "@iraf/core"
import type { IAuthProvider } from "@iraf/core"

export const JWT_SECRET = process.env.IRAF_JWT_SECRET ?? "iraf-dev-secret-change-in-production"

/**
 * Remult getUser — parses user from Authorization header.
 * Delegates to IAuthProvider in ServiceRegistry.
 */
export async function getUser(req: { headers: Record<string, string | string[] | undefined> }) {
  const provider = ServiceRegistry.resolve<IAuthProvider>(SERVICE_KEYS.AUTH)
  if (!provider) return undefined
  return provider.getUser(req)
}

/**
 * Auth routes (login / me).
 */
export function createAuthRouter(withRemult: import("express").RequestHandler): Router {
  const router = Router()

  /** POST /api/auth/login */
  router.post("/api/auth/login", withRemult, async (req, res) => {
    try {
      const provider = ServiceRegistry.require<IAuthProvider>(SERVICE_KEYS.AUTH)
      const result = await provider.login(req.body)
      res.json(result)
    } catch (e: any) {
      const status = e.message?.toLowerCase?.().includes("disabled") ? 403 : 401
      res.status(status).json({ message: e.message ?? "Login failed" })
    }
  })

  /** GET /api/auth/me */
  router.get("/api/auth/me", withRemult, (_req, res) => {
    if (!remult.user) {
      res.status(401).json({ message: "Not authenticated" })
      return
    }
    res.json({ user: remult.user })
  })

  return router
}
