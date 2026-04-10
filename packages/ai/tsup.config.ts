import { defineConfig } from "tsup"

export default defineConfig([
  // Client-safe build: used by the Vite app (must not depend on Node built-ins)
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    splitting: false,
    dts: true,
    sourcemap: true,
    clean: true,
    esbuildOptions(options) {
      options.keepNames = true
    },
  },
  // Server-only build: used by `@iraf/ai/server`
  {
    entry: ["src/server.ts"],
    format: ["esm"],
    platform: "node",
    target: "node18",
    splitting: false,
    dts: true,
    sourcemap: true,
    clean: false,
    esbuildOptions(options) {
      options.keepNames = true
      options.banner ??= {}
      options.banner.js =
        (options.banner.js ? options.banner.js + "\n" : "") +
        'import { createRequire as __createRequire } from "module";\n' +
        "const require = __createRequire(import.meta.url);\n"
    },
  },
])
