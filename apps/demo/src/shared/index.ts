// apps/demo/src/shared/index.ts
// 所有 BO 在此登記 — 匯入此檔案即可觸發登記
import { EntityRegistry } from "@iraf/core"
import { Customer } from "./entities/Customer"

EntityRegistry.register(Customer)

export { Customer }
