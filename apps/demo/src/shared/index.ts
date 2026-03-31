// apps/demo/src/shared/index.ts
// 所有 BO 在此登記 — 匯入此檔案即可觸發登記
import { EntityRegistry, iRAFUser } from "@iraf/core"
import { Customer } from "./entities/Customer"
import "./controllers/CustomerController" // 觸發 @iController 裝飾器

EntityRegistry.register(Customer, iRAFUser)

export { Customer, iRAFUser }
