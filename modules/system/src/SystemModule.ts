import { defineModule } from "@iraf/core"
import { iRAFUser } from "./entities/iRAFUser"

export const SystemModule = defineModule({
  key: "system",
  caption: "系統管理",
  icon: "Settings",
  entities: [iRAFUser],
})
