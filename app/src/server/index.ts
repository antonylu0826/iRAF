// app/src/server/index.ts
import "dotenv/config"
import express from "express"
import { remultExpress } from "remult/remult-express"
import { remult } from "remult"
import bcrypt from "bcrypt"
import { EntityRegistry, ModuleRegistry, ServiceRegistry, SERVICE_KEYS, type IPasswordHasher } from "@iraf/core"
import { AppUser } from "@iraf/module-system"
import { ACTUAL_SECRET, getUser, createAuthRouter } from "./auth"
import { JwtAuthProvider } from "./JwtAuthProvider"
import helmet from "helmet"
import { createMetaRouter } from "./metaRouter"
import "../modules" // Trigger ModuleRegistry.use(...)

// ─── DataProvider ─────────────────────────────────────────────────────────────
async function createDataProvider() {
  if (process.env.DATABASE_URL) {
    const { createPostgresDataProvider } = await import("remult/postgres")
    console.log("[iRAF] Using PostgreSQL data provider")
    return createPostgresDataProvider({ connectionString: process.env.DATABASE_URL })
  }
  // Default: JSON files (development only)
  console.log("[iRAF] Using JSON file data provider (dev)")
  return undefined
}

// ─── Register services ────────────────────────────────────────────────────────
ServiceRegistry.register(SERVICE_KEYS.AUTH, new JwtAuthProvider({ secret: ACTUAL_SECRET }))
ServiceRegistry.register<IPasswordHasher>(SERVICE_KEYS.PASSWORD_HASHER, {
  hash: (password: string) => bcrypt.hash(password, 10),
  compare: (password: string, hash: string) => bcrypt.compare(password, hash),
})

const app = express()
app.use(helmet())
app.use(express.json())

// remultExpress must run first to establish remult context (auth needs remult.repo()).
const dataProvider = await createDataProvider() // eslint-disable-line
const api = remultExpress({
  entities: EntityRegistry.getAll() as any[],
  controllers: EntityRegistry.getAllControllers() as any[],
  dataProvider,
  getUser,
  initApi: async () => {
    const repo = remult.repo(AppUser)
    const count = await repo.count()
    if (count === 0) {
      const username = process.env.IRAF_ADMIN_USERNAME ?? "admin"
      const password = process.env.IRAF_ADMIN_PASSWORD ?? "admin123"
      const passwordHash = await bcrypt.hash(password, 10)
      await repo.insert({ username, passwordHash, displayName: username, roles: ["admins"] })
      console.log(`[iRAF] Created default admin user: ${username}`)
    }
  },
})
app.use(api)

// Auth routes (login / me) — use api.withRemult for remult context
app.use(createAuthRouter(api.withRemult))

// iRAF metadata API (for MCP and tooling)
app.use(createMetaRouter())

app.get("/", (_req, res) => {
  res.json({ status: "iRAF Demo Server running", version: "0.1.0" })
})

const PORT = 3001

async function startServer() {
  // Run server-side init for all modules.
  await ModuleRegistry.serverInitAll()

  app.listen(PORT, () => {
    console.log(`iRAF Demo Server started on http://localhost:${PORT}`)
  })
}

startServer()
