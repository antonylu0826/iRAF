import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  // bcrypt is a native CJS module — must not be bundled into ESM output
  external: ["bcrypt"],
  esbuildOptions(options) {
    options.keepNames = true
  },
})
