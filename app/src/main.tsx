import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./modules" // trigger ModuleRegistry.use(...)
import { initPlugins } from "@iraf/plugin-system"
import { iRAFApp as App } from "@iraf/react"

initPlugins()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App title="iRAF Demo" />
  </StrictMode>
)
