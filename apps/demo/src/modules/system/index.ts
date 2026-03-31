import { defineModule, iRAFUser } from "@iraf/core"

export const SystemModule = defineModule({
  key: "system",
  caption: "系統管理",
  icon: "Settings",
  entities: [iRAFUser],
})
