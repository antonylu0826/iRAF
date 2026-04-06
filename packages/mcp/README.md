# @iraf/mcp — iRAF MCP Server

Connects AI agents (Claude Desktop, Gemini, Cursor) to a running iRAF application via the Model Context Protocol.

## Setup

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `IRAF_BASE_URL` | No | `http://localhost:3001` | iRAF server URL |
| `IRAF_USERNAME` | Auth* | — | Login username |
| `IRAF_PASSWORD` | Auth* | — | Login password |
| `IRAF_API_TOKEN` | Auth* | — | Static JWT (alternative to username/password) |
| `IRAF_WORKSPACE` | Dev tools | `cwd` | Repo root path (required for `get_example`) |
| `MCP_TRANSPORT` | No | `http` | `stdio` or `http` |
| `MCP_PORT` | No | `3002` | Port for HTTP transport |

*One of `IRAF_API_TOKEN` or `IRAF_USERNAME` + `IRAF_PASSWORD` is required.

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "iraf": {
      "command": "node",
      "args": ["/path/to/iRAF/packages/mcp/dist/index.js", "--stdio"],
      "env": {
        "IRAF_BASE_URL": "http://localhost:3001",
        "IRAF_USERNAME": "admin",
        "IRAF_PASSWORD": "your-password",
        "IRAF_WORKSPACE": "/path/to/iRAF"
      }
    }
  }
}
```

### HTTP / SSE (Gemini, Cursor, etc.)

```bash
IRAF_BASE_URL=http://localhost:3001 \
IRAF_USERNAME=admin \
IRAF_PASSWORD=your-password \
IRAF_WORKSPACE=/path/to/iRAF \
node packages/mcp/dist/index.js
# → iRAF MCP Server running on http://localhost:3002/mcp
```

## Available tools

### Operation tools (query & modify data)

| Tool | Description |
|---|---|
| `list_entities` | List all entities with fields and available actions |
| `get_record` | Get a single record by entity key and ID |
| `query_records` | Query records with filter / sort / pagination |
| `create_record` | Create a new record |
| `update_record` | Update an existing record |
| `delete_record` | Delete a record |
| `call_action` | Trigger a `@iAction` business action on a record |

### Dev tools (code generation)

| Tool | Description |
|---|---|
| `get_example` | Read entity source file as a reference template |
| `scaffold_entity` | Generate entity TypeScript code from a schema |
| `scaffold_module` | Generate module index.ts skeleton |

## Build

```bash
npm run build --workspace=packages/mcp
```
