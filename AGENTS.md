# iRAF Agent Guide

> Read this file at the start of every conversation. It gives you the map — read source files for details.

---

## Repo Layout

```
iRAF/
├── packages/
│   ├── core/          @iraf/core       — decorators, registries, types (no React, no Remult UI)
│   └── react/         @iraf/react      — AppShell, PluginRegistry, i18n hooks, UI primitives
├── plugins/
│   └── system/        @iraf/plugin-system — ListView, DetailView, SubGrid, built-in controls
├── modules/
│   ├── system/        @iraf/module-system — Users entity, system roles, auth
│   └── sample/        @iraf/module-sample — Full demo: FeatureGallery, MasterItem, DetailItem
└── app/               Vite app — wires everything together (main.tsx, server/index.ts)
```

Build order (tsup, watch mode): `core` → `react` → `plugin-system` → modules → `app`

---

## Key Concepts

### 1. EntityRegistry + `@iEntity` / `@iField`
Every BO (business object) is decorated with `@iEntity` and `@iField.*`.
Decorators store metadata in `Reflect` — UI reads metadata at runtime, no codegen needed.

```ts
@iEntity("orders", { caption: "Orders", icon: "ShoppingCart", allowedRoles: { ... } })
export class Order extends BaseObject {
  @iField.string({ caption: "Order No", required: true, order: 1 })
  orderNo = ""
}
```

`BaseObject` provides `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy` (audit fields).

### 2. ModuleRegistry + `defineModule`
Modules group entities, controllers, menu, roles, i18n, and lifecycle hooks.

```ts
export const MyModule = defineModule({
  key: "my-module",
  caption: "My Module",
  entities: [Order, OrderLine],
  controllers: [OrderController],
  menu: [{ entity: Order, caption: "Orders", icon: "ShoppingCart", order: 1 }],
  i18n: { "zh-TW": { "Orders": "訂單" } },
})
```

Register in `app/src/modules/index.ts` via `ModuleRegistry.use(MyModule)`.

### 3. PluginRegistry — controls and slots
UI controls are plugins keyed by name. DetailView and SubGrid resolve controls at runtime.

- **Controls** — input components: `"string"`, `"number"`, `"date"`, `"boolean"`, `"textarea"`, `"select"`, `"lookup"`, `"password"`, `"roles"`, `"subgrid"`
- **Slots** — injection points: `"detail-header"`, `"detail-toolbar"`, `"sidebar-bottom"`, `"sidebar-top"`
- **List views** — `"list"` (default ListView)

Resolve order: `field.control` → options → ref → `field._type` default.

### 4. Master-Detail (`@iField.collection`)
Parent entity declares child collections with `@iField.collection`. DetailView renders them as SubGrid automatically.

```ts
@iField.collection({ caption: "Lines", entity: () => OrderLine, foreignKey: "orderId", order: 10 })
lines: OrderLine[] = []
```

**Save flow:**
- **Existing master** — SubGrid calls child repo directly (insert / save / delete).
- **New master** — SubGrid emits rows via `onChange`; DetailView saves master first, then batch-inserts child rows with the new master ID.

### 5. `@iAction` + `@iController`
Server-side actions attached to an entity. Shown as buttons in DetailView toolbar.

```ts
@iController(Order)
export class OrderController {
  @iAction({ caption: "Confirm", icon: "CheckCircle", allowedRoles: ["admins"] })
  static async confirm(id: string): Promise<void> { ... }
}
```

### 6. Bootstrap order (`app/src/main.tsx`)
```
ModuleRegistry.initAll()  →  initPlugins()  →  React render
```
`initAll()` must run before `initPlugins()` so module plugins are registered before controls resolve.

### 7. i18n
- Namespace `iraf:core` — system UI strings (Loading, Save, Cancel, …)
- Namespace `iraf:module:<key>` — module-provided translations via `IModuleOptions.i18n`
- `useI18n("iraf:core")` returns `{ t }` hook; `t(key, { ns, defaultValue })` for module ns
- Error codes are translated client-side via `translateError(t, error)` from `@iraf/react`

---

## Conventions

| Thing | Rule |
|---|---|
| Entity key | kebab-case plural: `"order-lines"` |
| Entity file | `modules/<m>/src/entities/OrderLine.ts` |
| Entity class | PascalCase: `OrderLine` |
| Module key | kebab-case: `"sales"` |
| Module file | `modules/<m>/src/index.ts`, export `const SalesModule` |
| FK field name | `parentId` (e.g. `orderId`, `masterId`) |
| Controller | Same file as entity or named `OrderController.ts` |
| Field order | Explicit `order: N` — lower = earlier |
| Group name | Title Case string matching i18n key |

Every entity **must** extend `BaseObject` to get audit fields and correct `@iEntity` hook behavior.

---

## How to Add an Entity

1. Create `modules/<m>/src/entities/MyEntity.ts` — extend `BaseObject`, decorate with `@iEntity` + `@iField.*`
2. Register in `modules/<m>/src/index.ts` — add to `entities: [...]` and optionally `menu: [...]`
3. Add i18n keys to `IModuleOptions.i18n` for captions you want translated
4. Build: `pnpm --filter @iraf/module-<m> build`

**Reference:** `modules/sample/src/entities/FeatureGallery.ts` — covers all field types, RBAC, iAction.

## How to Add a Module

1. Create `modules/<name>/src/index.ts` with `defineModule({ key, caption, entities, menu, i18n })`
2. Add `package.json` with `name: "@iraf/module-<name>"` and `tsup.config.ts` (copy from `modules/sample/`)
3. Import and register in `app/src/modules/index.ts`: `ModuleRegistry.use(MyModule)`
4. Add to `app/package.json` dependencies and rebuild

## How to Add a Control Plugin

1. Create component in `plugins/system/src/controls/MyControl.tsx`  
   Props: `{ value, onChange, disabled, field, entity }`
2. Register in `plugins/system/src/initPlugins.ts`:
   ```ts
   PluginRegistry.register("control", { name: "my-control", caption: "...", component: MyControl })
   // Optionally set as default for a type:
   PluginRegistry.setDefault("control", "mytype", "my-control")
   ```
3. Use via `@iField.string({ control: "my-control" })` on any field

## How to Add a Slot Plugin

```ts
PluginRegistry.register("slot", {
  name: "detail-toolbar:my-feature",  // prefix must match SlotArea prefix
  caption: "...",
  component: MyToolbarButton,
})
```

---

## Anti-patterns

- **Don't** call `remult.repo()` client-side for collection saves inside SubGrid — for new masters, use `onChange` and let DetailView handle persistence.
- **Don't** skip `BaseObject` — the `@iEntity` saving hook writes audit fields unconditionally; missing fields cause silent failures.
- **Don't** register modules after `initPlugins()` — module plugins won't be available.
- **Don't** put business logic in `@iField.validate` — it runs client-side only; put authoritative validation in `@iEntity.saving`.
- **Don't** mutate `EntityRegistry` or `ModuleRegistry` after bootstrap — registries are effectively frozen after `initAll()`.

---

## Where to Look

| Question | File |
|---|---|
| All `@iField.*` options | `packages/core/src/types/metadata.ts` → `IFieldMeta` |
| Entity / field decorator impl | `packages/core/src/decorators/iEntity.ts`, `iField.ts` |
| RBAC role check logic | `packages/core/src/utils/roleCheck.ts` |
| How DetailView renders fields | `plugins/system/src/DetailView.tsx` |
| How ListView renders rows | `plugins/system/src/ListView.tsx` |
| SubGrid (Master-Detail) | `plugins/system/src/controls/SubGrid.tsx` |
| All registered controls | `plugins/system/src/initPlugins.ts` |
| Lookup label resolution | `plugins/system/src/utils/refLabel.ts`, `refLabelCache.ts` |
| Module options interface | `packages/core/src/types/module.ts` → `IModuleOptions` |
| System module (Users entity) | `modules/system/src/` |
| Full feature demo | `modules/sample/src/entities/FeatureGallery.ts` |
| Master-Detail demo | `modules/sample/src/entities/MasterItem.ts` + `DetailItem.ts` |
| App bootstrap | `app/src/main.tsx`, `app/src/server/index.ts` |

---

## MCP Server (`@iraf/mcp`)

AI agents can operate iRAF data via MCP without file system access.

**Operation tools:** `list_entities` · `get_record` · `query_records` · `create_record` · `update_record` · `delete_record` · `call_action`

**Dev tools:** `get_example` · `scaffold_entity` · `scaffold_module`

Setup and env vars: see `packages/mcp/README.md`

**Typical workflow for building a new module via MCP:**
1. `get_example` → read FeatureGallery or MasterItem as template
2. `scaffold_entity` → generate entity code (returns text, write to file yourself)
3. `scaffold_module` → generate module index.ts
4. Register in `app/src/modules/index.ts`, rebuild, restart server
5. `list_entities` → verify the new entity appears
