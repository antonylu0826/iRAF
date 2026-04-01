import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@iraf/react": path.resolve(__dirname, "../packages/react/src/index.ts"),
      "@iraf/plugin-system": path.resolve(__dirname, "../plugins/system/src/index.ts"),
      "@iraf/module-system": path.resolve(__dirname, "../modules/system/src/index.ts"),
      "@iraf/module-sample": path.resolve(__dirname, "../modules/sample/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
