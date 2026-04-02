// app/src/server/index.ts
import "dotenv/config"
import express from "express"
import { remultExpress } from "remult/remult-express"
import { remult } from "remult"
import bcrypt from "bcrypt"
import { EntityRegistry, ModuleRegistry, ServiceRegistry, SERVICE_KEYS } from "@iraf/core"
import { AppUser } from "@iraf/module-system"
import { JWT_SECRET, getUser, createAuthRouter } from "./auth"
import { JwtAuthProvider } from "./JwtAuthProvider"
import "../modules" // 觸發 ModuleRegistry.use(...)

// ─── 登記服務 ──────────────────────────────────────────────────────────────────
ServiceRegistry.register(SERVICE_KEYS.AUTH, new JwtAuthProvider({ secret: JWT_SECRET }))

const app = express()
app.use(express.json())

// remultExpress 必須先執行，才能建立 remult context（auth 路由需要 remult.repo()）
const api = remultExpress({
  entities: EntityRegistry.getAll() as any[],
  controllers: EntityRegistry.getAllControllers() as any[],
  getUser,
  initApi: async () => {
    const repo = remult.repo(AppUser)
    const count = await repo.count()
    if (count === 0) {
      const username = process.env.IRAF_ADMIN_USERNAME ?? "admin"
      const password = process.env.IRAF_ADMIN_PASSWORD ?? "admin123"
      const passwordHash = await bcrypt.hash(password, 10)
      await repo.insert({ username, passwordHash, displayName: username, roles: ["admins"] })
      console.log(`[iRAF] 已建立預設管理員帳號：${username}`)
    }
  },
})
app.use(api)

// Auth 路由（login / me）— 使用 api.withRemult 建立 remult context
app.use(createAuthRouter(api.withRemult))

app.get("/", (_req, res) => {
  res.json({ status: "iRAF Demo Server running", version: "0.1.0" })
})

const PORT = 3001
app.listen(PORT, async () => {
  // 執行所有模組的 server 側初始化
  await ModuleRegistry.serverInitAll()
  console.log(`iRAF Demo Server started on http://localhost:${PORT}`)
})
