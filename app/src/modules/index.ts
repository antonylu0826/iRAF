// app/src/modules/index.ts
// Register all modules — importing this file triggers ModuleRegistry.use()
import { ModuleRegistry } from "@iraf/core"
import { SystemModule } from "@iraf/module-system"
import { SampleModule } from "@iraf/module-sample"
import { ProductModule } from "@iraf/module-product"

ModuleRegistry.use(SystemModule, SampleModule, ProductModule)

export { SystemModule, SampleModule, ProductModule }
