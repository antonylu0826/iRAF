// app/src/modules/index.ts
// 登記所有模組 — 匯入此檔案即觸發 ModuleRegistry.use()
import { ModuleRegistry } from "@iraf/core"
import { SystemModule } from "@iraf/module-system"
import { SampleModule } from "@iraf/module-sample"

ModuleRegistry.use(SystemModule, SampleModule)

export { SystemModule, SampleModule }
