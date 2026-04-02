import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./modules" // Trigger ModuleRegistry.use(...)
import { ModuleRegistry } from "@iraf/core"
import { initPlugins } from "@iraf/plugin-system"
import { iRAFApp as App } from "@iraf/react"

async function bootstrap() {
  // 1. Run client-side init for all modules (onInit)
  await ModuleRegistry.initAll()

  // 2. Register UI plugins (including module plugins)
  initPlugins()

  // 3. React render
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App title="iRAF Demo" />
    </StrictMode>
  )
}

bootstrap()
