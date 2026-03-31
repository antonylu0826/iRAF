// apps/demo/src/server/index.ts
import express from "express"
import { remultExpress } from "remult/remult-express"
import { Customer } from "../shared/entities/Customer"
import { iRAFUser } from "@iraf/core"
import { getUser, createAuthRouter } from "./auth"

const app = express()
app.use(express.json())

// Auth 路由（login / register / me）
app.use(createAuthRouter())

app.use(
  remultExpress({
    entities: [Customer, iRAFUser],
    getUser,
  })
)

app.get("/", (_req, res) => {
  res.json({ status: "iRAF Demo Server running", version: "0.1.0" })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`iRAF Demo Server started on http://localhost:${PORT}`)
})
