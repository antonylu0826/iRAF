import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "react-router", "lucide-react", "remult", "@iraf/core", "@iraf/react"],
  esbuildOptions(options) {
    options.keepNames = true
  },
})
