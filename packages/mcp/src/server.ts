// server.ts — MCP server with iRAF operation tools

import { readdir, readFile, writeFile, mkdir } from "fs/promises"
import { join, dirname, resolve, normalize } from "path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { apiFetch } from "./client.js"

/** Resolve absolute path inside the iRAF workspace */
function workspace(...parts: string[]): string {
  const root = process.env.IRAF_WORKSPACE ?? process.cwd()
  return join(root, ...parts)
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "iraf-mcp",
    version: "0.1.0",
  })

  // ─── list_entities ────────────────────────────────────────────────────────────
  server.tool(
    "list_entities",
    "List all available entities with their key, caption, and field descriptions. Use this first to understand what data is available.",
    {},
    async () => {
      const entities = await apiFetch("/api/iraf/meta/entities")
      return { content: [{ type: "text" as const, text: JSON.stringify(entities, null, 2) }] }
    }
  )

  // ─── get_record ───────────────────────────────────────────────────────────────
  server.tool(
    "get_record",
    "Get a single record by entity key and ID.",
    {
      entityKey: z.string().describe("Entity key, e.g. 'master-items'. Get from list_entities."),
      id: z.string().describe("Record ID"),
    },
    async ({ entityKey, id }) => {
      const record = await apiFetch(`/api/${entityKey}/${id}`)
      return { content: [{ type: "text" as const, text: JSON.stringify(record, null, 2) }] }
    }
  )

  // ─── query_records ────────────────────────────────────────────────────────────
  server.tool(
    "query_records",
    "Query records from an entity with optional filtering, sorting, and pagination.",
    {
      entityKey: z.string().describe("Entity key, e.g. 'master-items'. Get from list_entities."),
      where: z
        .string()
        .optional()
        .describe('JSON filter, e.g. \'{"name":{"$contains":"foo"}}\' or \'{"status":"active"}\''),
      orderBy: z
        .string()
        .optional()
        .describe('JSON sort, e.g. \'{"createdAt":"desc"}\''),
      limit: z.number().int().min(1).max(200).optional().describe("Max records to return (default 25)"),
      page: z.number().int().min(1).optional().describe("Page number (1-based, used with limit)"),
    },
    async ({ entityKey, where, orderBy, limit = 25, page = 1 }) => {
      const params = new URLSearchParams()
      params.set("take", String(limit))
      params.set("skip", String((page - 1) * limit))
      if (where) params.set("where", where)
      if (orderBy) params.set("orderBy", orderBy)

      const records = await apiFetch(`/api/${entityKey}?${params}`)
      return { content: [{ type: "text" as const, text: JSON.stringify(records, null, 2) }] }
    }
  )

  // ─── create_record ────────────────────────────────────────────────────────────
  server.tool(
    "create_record",
    "Create a new record in an entity. Returns the created record with its assigned ID.",
    {
      entityKey: z.string().describe("Entity key, e.g. 'master-items'. Get from list_entities."),
      data: z.record(z.unknown()).describe("Field values as a JSON object, e.g. {\"name\": \"Order 001\"}"),
    },
    async ({ entityKey, data }) => {
      const created = await apiFetch(`/api/${entityKey}`, {
        method: "POST",
        body: JSON.stringify(data),
      })
      return { content: [{ type: "text" as const, text: JSON.stringify(created, null, 2) }] }
    }
  )

  // ─── update_record ────────────────────────────────────────────────────────────
  server.tool(
    "update_record",
    "Update an existing record by ID. Only provide the fields you want to change.",
    {
      entityKey: z.string().describe("Entity key, e.g. 'master-items'. Get from list_entities."),
      id: z.string().describe("Record ID"),
      data: z.record(z.unknown()).describe("Fields to update as a JSON object, e.g. {\"name\": \"New Name\"}"),
    },
    async ({ entityKey, id, data }) => {
      const updated = await apiFetch(`/api/${entityKey}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
      return { content: [{ type: "text" as const, text: JSON.stringify(updated, null, 2) }] }
    }
  )

  // ─── delete_record ────────────────────────────────────────────────────────────
  server.tool(
    "delete_record",
    "Delete a record by ID. This action is irreversible.",
    {
      entityKey: z.string().describe("Entity key, e.g. 'master-items'. Get from list_entities."),
      id: z.string().describe("Record ID to delete"),
    },
    async ({ entityKey, id }) => {
      await apiFetch(`/api/${entityKey}/${id}`, { method: "DELETE" })
      return { content: [{ type: "text" as const, text: `Deleted ${entityKey}/${id}` }] }
    }
  )

  // ─── call_action ──────────────────────────────────────────────────────────────
  server.tool(
    "call_action",
    "Call a business action (@iAction) on a record. Use get_record or query_records to find the ID first. Get controllerClass and methodName from list_entities (entity detail).",
    {
      controllerClass: z
        .string()
        .describe("Controller class name, e.g. 'FeatureGalleryController'. From list_entities actions[].controllerClass."),
      methodName: z
        .string()
        .describe("Action method name, e.g. 'incrementCount'. From list_entities actions[].methodName."),
      id: z.string().describe("ID of the record to act on"),
    },
    async ({ controllerClass, methodName, id }) => {
      const result = await apiFetch(`/api/${controllerClass}/${methodName}`, {
        method: "POST",
        body: JSON.stringify({ args: [id] }),
      })
      const text = result != null ? JSON.stringify(result, null, 2) : `Action '${methodName}' completed.`
      return { content: [{ type: "text" as const, text }] }
    }
  )

  // ─── write_file ───────────────────────────────────────────────────────────────
  server.tool(
    "write_file",
    "Write content to a file inside the iRAF workspace. Only allowed under modules/ and app/ directories. Creates parent directories automatically. Requires IRAF_WORKSPACE env var.",
    {
      path: z
        .string()
        .describe("Relative path from workspace root, e.g. 'modules/products/src/entities/Product.ts'"),
      content: z.string().describe("Full file content to write"),
    },
    async ({ path: relPath, content }) => {
      const root = process.env.IRAF_WORKSPACE
      if (!root) {
        return { content: [{ type: "text" as const, text: "Error: IRAF_WORKSPACE is not set." }] }
      }

      // Security: only allow writing under modules/ and app/
      const absPath = resolve(join(root, relPath))
      const normalized = normalize(absPath)
      const allowedRoots = [
        normalize(join(root, "modules")),
        normalize(join(root, "app")),
      ]
      const allowed = allowedRoots.some((r) => normalized.startsWith(r))
      if (!allowed) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: write_file only allows paths under modules/ or app/. Got: ${relPath}`,
          }],
        }
      }

      await mkdir(dirname(absPath), { recursive: true })
      await writeFile(absPath, content, "utf-8")
      return { content: [{ type: "text" as const, text: `Written: ${relPath}` }] }
    }
  )

  // ─── get_example ──────────────────────────────────────────────────────────────
  server.tool(
    "get_example",
    "Get the full TypeScript source of an existing iRAF entity as a reference template. Use before scaffolding to follow exact conventions. Requires IRAF_WORKSPACE env var pointing to the repo root.",
    {
      entityName: z
        .string()
        .describe("Entity class name (e.g. 'FeatureGallery') or file name without extension (e.g. 'MasterItem')"),
    },
    async ({ entityName }) => {
      const modulesDir = workspace("modules")
      let mods: string[]
      try {
        mods = (await readdir(modulesDir, { withFileTypes: true }))
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      } catch {
        return { content: [{ type: "text" as const, text: "IRAF_WORKSPACE is not set or modules/ directory not found." }] }
      }

      for (const mod of mods) {
        const dir = workspace("modules", mod, "src", "entities")
        try {
          const files = await readdir(dir)
          const match = files.find(
            (f) => f.toLowerCase() === `${entityName.toLowerCase()}.ts`
          )
          if (match) {
            const content = await readFile(join(dir, match), "utf-8")
            return { content: [{ type: "text" as const, text: content }] }
          }
        } catch {
          // directory doesn't exist, skip
        }
      }

      return {
        content: [{ type: "text" as const, text: `No entity file found for '${entityName}'. Try 'FeatureGallery' or 'MasterItem'.` }],
      }
    }
  )

  // ─── scaffold_entity ──────────────────────────────────────────────────────────
  server.tool(
    "scaffold_entity",
    "Generate iRAF entity TypeScript source code from a schema description. Returns code as text. NOTE: If you write validation logic, the function MUST return undefined on success, never true.",
    {
      name: z.string().describe("Entity class name in PascalCase, e.g. 'OrderLine'"),
      key: z.string().describe("Entity API key in kebab-case plural, e.g. 'order-lines'"),
      caption: z.string().describe("Display caption, e.g. 'Order Lines'"),
      icon: z.string().optional().describe("Lucide icon name, e.g. 'ShoppingCart'"),
      allowedRoles: z
        .object({
          read:   z.array(z.string()).optional(),
          create: z.array(z.string()).optional(),
          update: z.array(z.string()).optional(),
          delete: z.array(z.string()).optional(),
        })
        .optional()
        .describe("RBAC role arrays. Omit for public access."),
      fields: z.array(
        z.object({
          name:     z.string().describe("camelCase field name"),
          type:     z.enum(["string", "number", "date", "boolean", "json"]),
          caption:  z.string(),
          order:    z.number().optional(),
          group:    z.string().optional(),
          required: z.boolean().optional(),
          control:  z.string().optional().describe("e.g. 'textarea', 'password', 'roles'"),
          options:  z.array(z.string()).optional().describe("Enum options list"),
          ref:      z.string().optional().describe("Lookup entity key, e.g. 'users'"),
          refLabel: z.string().optional(),
          hidden:   z.boolean().optional(),
        })
      ),
    },
    async ({ name, key, caption, icon, allowedRoles, fields }) => {
      const lines: string[] = []
      lines.push(`import { iEntity, iField, BaseObject } from "@iraf/core"`)
      lines.push(``)
      lines.push(`@iEntity("${key}", {`)
      lines.push(`  caption: "${caption}",`)
      if (icon) lines.push(`  icon: "${icon}",`)
      if (allowedRoles) {
        lines.push(`  allowedRoles: {`)
        if (allowedRoles.read)   lines.push(`    read:   ${JSON.stringify(allowedRoles.read)},`)
        if (allowedRoles.create) lines.push(`    create: ${JSON.stringify(allowedRoles.create)},`)
        if (allowedRoles.update) lines.push(`    update: ${JSON.stringify(allowedRoles.update)},`)
        if (allowedRoles.delete) lines.push(`    delete: ${JSON.stringify(allowedRoles.delete)},`)
        lines.push(`  },`)
      }
      lines.push(`})`)
      lines.push(`export class ${name} extends BaseObject {`)

      for (const [i, f] of fields.entries()) {
        const opts: string[] = [`caption: "${f.caption}"`, `order: ${f.order ?? (i + 1) * 10}`]
        if (f.required) opts.push(`required: true`)
        if (f.hidden)   opts.push(`hidden: true`)
        if (f.group)    opts.push(`group: "${f.group}"`)
        if (f.control)  opts.push(`control: "${f.control}"`)
        if (f.options)  opts.push(`options: ${JSON.stringify(f.options)}`)
        if (f.ref)      opts.push(`ref: "${f.ref}"`)
        if (f.refLabel) opts.push(`refLabel: "${f.refLabel}"`)

        const defaults: Record<string, string> = {
          string: `""`, number: `0`, boolean: `false`, date: `new Date()`, json: `null`,
        }
        lines.push(`  @iField.${f.type}({ ${opts.join(", ")} })`)
        lines.push(`  ${f.name} = ${defaults[f.type] ?? `null`}`)
        lines.push(``)
      }

      lines.push(`}`)
      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )

  // ─── scaffold_module ──────────────────────────────────────────────────────────
  server.tool(
    "scaffold_module",
    "Generate an iRAF module index.ts skeleton. Returns code as text — does NOT write files.",
    {
      key:      z.string().describe("Module key in kebab-case, e.g. 'sales'"),
      caption:  z.string().describe("Module display name, e.g. 'Sales'"),
      entities: z.array(z.string()).describe("Entity class names to include, e.g. ['Customer', 'Order']"),
      menuEntities: z
        .array(z.string())
        .optional()
        .describe("Subset of entities to show in sidebar menu. Defaults to all entities."),
    },
    async ({ key, caption, entities, menuEntities }) => {
      const menuList = menuEntities ?? entities
      const exportName = key
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("") + "Module"

      const lines: string[] = []
      lines.push(`import { defineModule } from "@iraf/core"`)
      for (const e of entities) lines.push(`import { ${e} } from "./entities/${e}"`)
      lines.push(``)
      lines.push(`export const ${exportName} = defineModule({`)
      lines.push(`  key: "${key}",`)
      lines.push(`  caption: "${caption}",`)
      lines.push(`  entities: [${entities.join(", ")}],`)
      lines.push(`  menu: [`)
      for (const [i, e] of menuList.entries()) {
        lines.push(`    { entity: ${e}, order: ${(i + 1) * 10} },`)
      }
      lines.push(`  ],`)
      lines.push(`  i18n: {`)
      lines.push(`    "zh-TW": {`)
      lines.push(`      "${caption}": "",  // TODO: add translations`)
      lines.push(`    },`)
      lines.push(`  },`)
      lines.push(`})`)

      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )

  return server
}
