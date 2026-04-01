import { defineModule } from "@iraf/core"
import { AppUser } from "./entities/AppUser"
import { UserController } from "./controllers/UserController"

export const SystemModule = defineModule({
  key: "system",
  caption: "系統管理",
  icon: "Settings",
  entities: [AppUser],
  controllers: [UserController],
  allowedRoles: ["admins"],
})
