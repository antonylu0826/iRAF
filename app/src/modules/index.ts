// app/src/modules/index.ts
// Register all modules — importing this file triggers ModuleRegistry.use()
import { ModuleRegistry } from "@iraf/core"
import { SystemModule } from "@iraf/module-system"
import { SampleModule } from "@iraf/module-sample"
import { AiModule } from "@iraf/ai"
import { DashboardModule } from "@iraf/dashboard"

ModuleRegistry.use(SystemModule, SampleModule, AiModule, DashboardModule)

export { SystemModule, SampleModule, AiModule, DashboardModule }

