# iRAF — Claude Code Settings

> Framework conventions and architecture: read **AGENTS.md** first.
> This file adds Claude Code-specific commands and workflows.

---

## Commands

### Build (always build in dependency order)

```bash
# Build all in order
npm run build --workspace=packages/core
npm run build --workspace=packages/react
npm run build --workspace=plugins/system
npm run build --workspace=modules/system
npm run build --workspace=modules/sample
npm run build --workspace=app

# Build a single package
npm run build --workspace=packages/core

# Watch mode (run in separate terminals)
npm run build:watch --workspace=packages/core
npm run build:watch --workspace=modules/sample
```

### Dev

```bash
# Start full dev environment (server + vite)
npm run dev:demo
# Server: http://localhost:3001
# Client: http://localhost:5173
```

### Test

```bash
npm test                    # run all tests once
npm run test:watch          # watch mode
```

---

## Common Workflows

### Add a new entity to an existing module

1. Create `modules/<m>/src/entities/MyEntity.ts` — extend `BaseObject`, use `@iEntity` + `@iField.*`
2. Add to `modules/<m>/src/index.ts` — `entities: [...]` and optionally `menu: [...]`
3. `npm run build --workspace=modules/<m>`
4. Restart server — entity appears in UI and MCP

**Reference:** `modules/sample/src/entities/FeatureGallery.ts` (all field types + RBAC + @iAction)

### Add a new module

1. Create `modules/<name>/src/` with entities + `index.ts` (`defineModule(...)`)
2. Add `package.json` + `tsup.config.ts` (copy from `modules/sample/`)
3. Register in `app/src/modules/index.ts`: `ModuleRegistry.use(NewModule)`
4. Add to `app/package.json` dependencies
5. Build in order: new module → app

### Add a control plugin

1. Create component in `plugins/system/src/controls/MyControl.tsx`
2. Register in `plugins/system/src/initPlugins.ts`
3. Build `plugins/system` + `app`

---

## Key Things to Know

- **Bootstrap order matters:** `ModuleRegistry.initAll()` → `initPlugins()` → React render
- **esbuild strips `design:paramtypes`** — always use `paramTypes` explicitly in `BackendMethod` (handled by `@iAction`)
- **`@iAction` routes:** `/api/{ControllerClassName}/{methodName}` — do not use entity key
- **SubGrid + new master:** SubGrid emits rows via `onChange`; DetailView handles persistence after master save
- **Collection fields** use `@iField.collection` with `Fields.json()` backing — not stored as FK at entity level
- **i18n namespace format:** `iraf:core` (system), `iraf:module:<key>` (per module)

---

## MCP Server

```bash
# Run MCP in HTTP mode (for testing)
IRAF_BASE_URL=http://localhost:3001 \
IRAF_USERNAME=admin \
IRAF_PASSWORD=admin123 \
IRAF_WORKSPACE=$(pwd) \
node packages/mcp/dist/index.js
# → http://localhost:3002/mcp
```

Config for Claude Desktop: see `packages/mcp/README.md`
