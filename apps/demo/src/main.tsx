import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./shared" // trigger EntityRegistry.register(...)
import { iRAFApp as App } from "@iraf/react"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App title="iRAF Demo" />
  </StrictMode>
)
