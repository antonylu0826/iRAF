import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/server/index.ts"],
  format: ["esm"],
  outDir: "dist-server",
  sourcemap: true,
  clean: true,
  // Keep names for Remult decorator metadata
  esbuildOptions(options) {
    options.keepNames = true
  },
})
