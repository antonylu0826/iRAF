# iRAF — i Rapid Application Framework

A metadata-driven full-stack business application framework built with TypeScript. Define your business objects once — UI, API, validation, and permissions are all derived automatically.

Inspired by DevExpress XAF's metadata-driven philosophy, redesigned from scratch with AI-agent collaboration as a first-class concern.

---

## Design Principles

1. **BO as single source of truth** — define an entity once; UI, API, validation, and RBAC all derive from it
2. **Sensible defaults, open overrides** — full CRUD out of the box; every layer is replaceable
3. **AI-agent friendly** — consistent structure and naming conventions so different agents produce consistent results
4. **Progressive complexity** — simple entities need zero extra config; advanced features opt in

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (full-stack) |
| Backend | Node.js + Express + Remult |
| Database | SQLite (dev) → PostgreSQL (prod) via Remult DataProvider |
| Frontend | React + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Icons | lucide-react |
| Routing | React Router v7 |

---

## Repo Structure

```
iRAF/
├── packages/
│   ├── core/          @iraf/core          — decorators, registries, base types
│   ├── react/         @iraf/react         — AppShell, PluginRegistry, i18n
│   └── mcp/           @iraf/mcp           — MCP server for AI agent integration
├── plugins/
│   └── system/        @iraf/plugin-system — ListView, DetailView, SubGrid, controls
├── modules/
│   ├── system/        @iraf/module-system — Users, roles, auth
│   └── sample/        @iraf/module-sample — Full demo (FeatureGallery, MasterItem)
└── app/                                   — Vite + Express host app
```

---

## Quick Start

```bash
npm install

# Build all packages (in dependency order)
npm run build --workspace=packages/core
npm run build --workspace=packages/react
npm run build --workspace=plugins/system
npm run build --workspace=modules/system
npm run build --workspace=modules/sample
npm run build --workspace=app

# Start dev server
npm run dev:demo
# Server → http://localhost:3001
# Client → http://localhost:5173
```

Default credentials: `admin` / `admin123`

---

## Defining a Business Object

```ts
// modules/sales/src/entities/Order.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

@iEntity("orders", {
  caption: "Orders",
  icon: "ShoppingCart",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers"],
    update: ["admins", "managers"],
    delete: ["admins"],
  },
})
export class Order extends BaseObject {
  @iField.string({ caption: "Order No", required: true, order: 1 })
  orderNo = ""

  @iField.string({ caption: "Customer", ref: "customers", refLabel: "name", order: 2 })
  customerId = ""

  @iField.string({ caption: "Status", options: ["Draft", "Confirmed", "Shipped"], order: 3 })
  status = "Draft"

  @iField.number({ caption: "Total", order: 4 })
  total = 0
}
```

That's it. The entity appears in the sidebar, gets a full ListView + DetailView, validation, and a REST API — automatically.

**Full field type reference:** `modules/sample/src/entities/FeatureGallery.ts`  
**Master-Detail reference:** `modules/sample/src/entities/MasterItem.ts`

---

## AI Agent Integration (MCP)

iRAF ships with an MCP server that lets AI agents (Claude, Gemini, Cursor) operate business data and scaffold new modules without file system access.

```bash
# Start MCP server (HTTP mode)
IRAF_BASE_URL=http://localhost:3001 \
IRAF_USERNAME=admin \
IRAF_PASSWORD=admin123 \
IRAF_WORKSPACE=$(pwd) \
node packages/mcp/dist/index.js
# → http://localhost:3002/mcp
```

**Available tools:** `list_entities` · `query_records` · `get_record` · `create_record` · `update_record` · `delete_record` · `call_action` · `get_example` · `scaffold_entity` · `scaffold_module`

Setup details: [`packages/mcp/README.md`](packages/mcp/README.md)  
Claude Desktop config: see `packages/mcp/README.md`

---

## Multi-Agent Orchestration (Docker Agent)

iRAF includes a pre-configured [Docker Agent](https://docs.docker.com/ai/gordon/agents/) team that can autonomously build and deploy new modules.

**Prerequisites:** Docker Desktop with the Agent feature enabled.

```bash
# Start the iRAF agent team (run from iRAF root)
docker agent run agents/iraf-team.yaml

# With a specific task
docker agent run agents/iraf-team.yaml "建立一個產品管理系統，包含名稱、單價、庫存欄位"
```

**Agent roles:**

| Agent | Role |
|---|---|
| `root` | Orchestrator — coordinates tasks between sub-agents |
| `iraf-agent` | Operates data via MCP (query, scaffold, write files) |
| `builder-agent` | Runs `npm build` + `docker restart iraf-server` |

**Typical auto-build flow:**
1. `root` receives user request
2. `iraf-agent` scaffolds entity code → writes files via `write_file` MCP tool
3. `builder-agent` builds the new module and restarts the server
4. `iraf-agent` verifies with `list_entities`

> Note: `IRAF_WORKSPACE` in `agents/iraf-team.yaml` must match the absolute path of this repo on your machine.

---

## For AI Agents

Read **[AGENTS.md](AGENTS.md)** at the start of every session — it contains repo layout, key concepts, naming conventions, common workflows, and anti-patterns.

Tool-specific guides:
- Claude Code → [CLAUDE.md](CLAUDE.md)
- Gemini → [GEMINI.md](GEMINI.md)
- Cursor → [.cursorrules](.cursorrules)
