import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  experimentalDts: false,
  esbuildOptions(options) {
    options.keepNames = true
  },
})
