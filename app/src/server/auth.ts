// apps/demo/src/server/auth.ts
// JWT 認證輔助：login 路由 + Remult getUser middleware
import { Router } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { remult } from "remult"
import { AppUser } from "@iraf/module-system"

export const JWT_SECRET = process.env.IRAF_JWT_SECRET ?? "iraf-dev-secret-change-in-production"
const TOKEN_EXPIRES = "8h"

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export function signToken(user: AppUser): string {
  return jwt.sign(
    { id: user.id, name: user.displayName || user.username, roles: user.roles },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES }
  )
}

/** Remult getUser — 從 Authorization header 解析 JWT，回傳 UserInfo */
export async function getUser(req: { headers: Record<string, string | string[] | undefined> }) {
  const authHeader = req.headers["authorization"]
  if (!authHeader || typeof authHeader !== "string") return undefined
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; name: string; roles: string[] }
    return { id: payload.id, name: payload.name, roles: payload.roles }
  } catch {
    return undefined
  }
}

// ─── Auth Router ──────────────────────────────────────────────────────────────

export function createAuthRouter(withRemult: import("express").RequestHandler): Router {
  const router = Router()

  /** POST /api/auth/login — 驗證帳號密碼，回傳 JWT */
  router.post("/api/auth/login", withRemult, async (req, res) => {
    try {
      const { username, password } = req.body as { username?: string; password?: string }
      if (!username || !password) {
        res.status(400).json({ message: "帳號與密碼為必填" })
        return
      }
      const repo = remult.repo(AppUser)
      const user = await repo.findFirst({ username })
      if (!user) {
        res.status(401).json({ message: "帳號或密碼錯誤" })
        return
      }
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        res.status(401).json({ message: "帳號或密碼錯誤" })
        return
      }
      if (user.isActive === false) {
        res.status(403).json({ message: "帳號已停用，請聯絡管理員" })
        return
      }
      res.json({ token: signToken(user), user: { id: user.id, name: user.displayName || user.username, roles: user.roles } })
    } catch (e) {
      console.error("[auth/login error]", e)
      res.status(500).json({ message: String(e) })
    }
  })

  /** POST /api/auth/register — 僅開發用：建立首位管理員（只有在無任何使用者時有效） */
  router.post("/api/auth/register", withRemult, async (req, res) => {
    const { username, password, displayName } = req.body as {
      username?: string
      password?: string
      displayName?: string
    }
    if (!username || !password) {
      res.status(400).json({ message: "帳號與密碼為必填" })
      return
    }
    const repo = remult.repo(AppUser)
    const count = await repo.count()
    if (count > 0) {
      res.status(403).json({ message: "已有使用者存在，請聯絡管理員" })
      return
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await repo.insert({ username, passwordHash, displayName: displayName ?? username, roles: ["admins"] })
    res.json({ token: signToken(user), user: { id: user.id, name: user.displayName, roles: user.roles } })
  })

  /** GET /api/auth/me — 回傳目前登入使用者資訊 */
  router.get("/api/auth/me", withRemult, (req, res) => {
    const user = remult.user
    if (!user) {
      res.status(401).json({ message: "未登入" })
      return
    }
    res.json({ user })
  })

  return router
}
