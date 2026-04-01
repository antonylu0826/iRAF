import { defineModule } from "@iraf/core"
import { Customer } from "./entities/Customer"
import "./controllers/CustomerController" // 觸發 @iController 裝飾器

export const SalesModule = defineModule({
  key: "sales",
  caption: "銷售",
  icon: "ShoppingCart",
  entities: [Customer],
})
