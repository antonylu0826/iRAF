import { defineModule } from "@iraf/core"
import { Sample } from "./entities/Sample"
import { SampleController } from "./controllers/SampleController"

/**
 * SampleModule — 用於測試 iRAF 框架所有功能的範例模組。
 */
export const SampleModule = defineModule({
  key: "sample",
  caption: "範例測試",
  icon: "FlaskConical",
  description: "提供各種控制項、iAction 與驗證功能的測試實體。",
  entities: [Sample],
  controllers: [SampleController],
})
