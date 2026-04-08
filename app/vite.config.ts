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
  build: {
    // VITE_API_URL allows overriding the API base in production builds.
    // When empty, remult defaults to same-origin (nginx handles the proxy).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("remult")) return "remult"
            if (id.includes("lucide-react")) return "icons"
            return "vendor"
          }
        },
      },
    },
  },
})
