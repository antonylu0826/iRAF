import { defineModule } from "@iraf/core"
import { AppUser } from "./entities/AppUser"

export const SystemModule = defineModule({
  key: "system",
  caption: "系統管理",
  icon: "Settings",
  entities: [AppUser],
})
