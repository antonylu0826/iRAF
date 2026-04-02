import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./modules" // 觸發 ModuleRegistry.use(...)
import { ModuleRegistry } from "@iraf/core"
import { initPlugins } from "@iraf/plugin-system"
import { iRAFApp as App } from "@iraf/react"

async function bootstrap() {
  // 1. 執行所有模組的 client 側初始化（onInit）
  await ModuleRegistry.initAll()

  // 2. 登記 UI plugins（含 module plugins）
  initPlugins()

  // 3. React render
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App title="iRAF Demo" />
    </StrictMode>
  )
}

bootstrap()
