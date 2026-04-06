// index.ts — iRAF MCP Server entry point
//
// Transport selection (via MCP_TRANSPORT env or --stdio flag):
//   stdio  — for Claude Desktop
//   http   — HTTP + SSE via StreamableHTTP (default, for Gemini / Cursor / etc.)
//
// Required env vars:
//   IRAF_BASE_URL      iRAF server base URL (default: http://localhost:3001)
//   IRAF_API_TOKEN     Static JWT token  — OR —
//   IRAF_USERNAME      Login username    }
//   IRAF_PASSWORD      Login password    } auto-login mode
//
// Optional env vars (http mode):
//   MCP_PORT           Port to listen on (default: 3002)

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import express from "express"
import { createMcpServer } from "./server.js"

const mode =
  process.env.MCP_TRANSPORT ??
  (process.argv.includes("--stdio") ? "stdio" : "http")

const mcpServer = createMcpServer()

if (mode === "stdio") {
  // ─── stdio transport (Claude Desktop) ───────────────────────────────────────
  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
} else {
  // ─── HTTP / SSE transport (Gemini, Cursor, etc.) ────────────────────────────
  const app = express()
  app.use(express.json())

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session management needed
  })

  // Single endpoint handles both GET (SSE stream) and POST (messages)
  app.all("/mcp", async (req, res) => {
    await transport.handleRequest(req, res, req.body)
  })

  await mcpServer.connect(transport)

  const PORT = Number(process.env.MCP_PORT ?? 3002)
  app.listen(PORT, () => {
    console.log(`iRAF MCP Server running on http://localhost:${PORT}/mcp`)
    console.log(`Base URL: ${process.env.IRAF_BASE_URL ?? "http://localhost:3001"}`)
  })
}
