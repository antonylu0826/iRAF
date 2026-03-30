// apps/demo/src/server/index.ts
import express from "express"
import { remultExpress } from "remult/remult-express"
import { Customer } from "../shared/entities/Customer"

const app = express()

app.use(
  remultExpress({
    entities: [Customer],
    // Phase 1 使用 InMemoryDataProvider（預設），資料不持久化
    // Phase 4 會換成 SQLite/PostgreSQL
  })
)

app.get("/", (_req, res) => {
  res.json({ status: "iRAF Demo Server running", version: "0.1.0" })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`iRAF Demo Server started on http://localhost:${PORT}`)
  console.log(`Customer API: http://localhost:${PORT}/api/customers`)
})
