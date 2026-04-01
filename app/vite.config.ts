import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // UI packages: point to source for hot reload
      "@iraf/react": path.resolve(__dirname, "../packages/react/src/index.ts"),
      "@iraf/plugin-system": path.resolve(__dirname, "../plugins/system/src/index.ts"),
      // Modules: resolve from dist — tsup keepNames:true preserves class names
      // for remult BackendMethod URL generation. Vite/Babel source transforms
      // run class decorators before the class name is set, breaking the routes.
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
