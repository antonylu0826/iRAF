import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  splitting: false,
  dts: true,
  sourcemap: true,
  clean: true,
  esbuildOptions(options) {
    options.keepNames = true
  },
})
