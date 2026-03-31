// apps/demo/src/modules/index.ts
// 登記所有模組 — 匯入此檔案即觸發 ModuleRegistry.use()
import { ModuleRegistry } from "@iraf/core"
import { SalesModule } from "./sales"
import { SystemModule } from "./system"

ModuleRegistry.use(SalesModule, SystemModule)

export { SalesModule, SystemModule }
