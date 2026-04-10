import { Router } from "express"
import { remult } from "remult"
import type { IAiChatRequest, IAiConfirmRequest, IAiSSEEvent } from "@iraf/core"
import { AiConfigResolver } from "./configResolver.js"
import { AiConversation } from "./entities/AiConversation.js"
import { AiMessage } from "./entities/AiMessage.js"
import { AiOrchestrator } from "./orchestrator.js"
import { getAvailableTools } from "./tools/index.js"

export function createAiRouter(withRemult: any) {
  const router = Router()

  // ─── GET /api/ai/status ──────────────────────────────────────────────────
  router.get("/api/ai/status", withRemult, async (_req: any, res: any) => {
    const user = remult.user
    if (!user) return res.json({ enabled: false, hasAccess: false })

    const config = await AiConfigResolver.getConfig()
    const enabled = config?.enabled ?? false
    const hasAccess = enabled && (config?.allowedUserRoles ?? []).some((r: string) => (user.roles ?? []).includes(r))

    res.json({ enabled, hasAccess })
  })

  // ─── POST /api/ai/chat ──────────────────────────────────────────────────
  router.post("/api/ai/chat", withRemult, async (req: any, res: any) => {
    const user = remult.user
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const config = await AiConfigResolver.getConfig()
    if (!config?.enabled) return res.status(503).json({ error: "AI assistant is not enabled" })

    const hasAccess = (config.allowedUserRoles ?? []).some((r: string) => (user.roles ?? []).includes(r))
    if (!hasAccess) return res.status(403).json({ error: "No access to AI assistant" })

    const provider = await AiConfigResolver.getProvider()
    if (!provider) return res.status(503).json({ error: "AI provider not configured" })

    const { conversationId, message, context } = req.body as IAiChatRequest

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    const emit = (event: IAiSSEEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    try {
      const tools = getAvailableTools(user, config.allowWriteOperations)
      const orchestrator = new AiOrchestrator(provider, tools, {
        maxTokens: config.maxTokens,
        enableThinking: config.enableThinking,
        customSystemPrompt: config.customSystemPrompt,
      })

      await orchestrator.run(conversationId, message, context, user, emit)
    } catch (err: any) {
      emit({ type: "error", error: err.message })
    }

    res.end()
  })

  // ─── POST /api/ai/confirm ───────────────────────────────────────────────
  router.post("/api/ai/confirm", withRemult, async (req: any, res: any) => {
    const user = remult.user
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const config = await AiConfigResolver.getConfig()
    if (!config?.enabled) return res.status(503).json({ error: "AI assistant is not enabled" })

    const provider = await AiConfigResolver.getProvider()
    if (!provider) return res.status(503).json({ error: "AI provider not configured" })

    const { conversationId, pendingActionId, approved, reason } = req.body as IAiConfirmRequest

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    const emit = (event: IAiSSEEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    try {
      const tools = getAvailableTools(user, config.allowWriteOperations)
      const orchestrator = new AiOrchestrator(provider, tools, {
        maxTokens: config.maxTokens,
        enableThinking: config.enableThinking,
        customSystemPrompt: config.customSystemPrompt,
      })

      await orchestrator.handleConfirm(conversationId, pendingActionId, approved, reason, req.body.context ?? {}, user, emit)
    } catch (err: any) {
      emit({ type: "error", error: err.message })
    }

    res.end()
  })

  // ─── GET /api/ai/conversations ──────────────────────────────────────────
  router.get("/api/ai/conversations", withRemult, async (_req: any, res: any) => {
    const user = remult.user
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const where: any = {}
    if (!user.roles?.includes("admins")) {
      where.userId = user.id
    }

    const conversations = await remult.repo(AiConversation).find({
      where,
      orderBy: { createdAt: "desc" },
      limit: 50,
    })

    res.json(conversations)
  })

  // ─── GET /api/ai/conversations/:id/messages ─────────────────────────────
  router.get("/api/ai/conversations/:id/messages", withRemult, async (req: any, res: any) => {
    const user = remult.user
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const conv = await remult.repo(AiConversation).findId(req.params.id)
    if (!conv) return res.status(404).json({ error: "Conversation not found" })

    // Non-admin can only see their own
    if (!user.roles?.includes("admins") && conv.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const messages = await remult.repo(AiMessage).find({
      where: { conversationId: req.params.id },
      orderBy: { seq: "asc" },
    })

    // Strip thinking for non-admins
    const isAdmin = user.roles?.includes("admins")
    const dtos = messages
      .filter(m => m.role !== "tool") // Don't send raw tool messages to frontend
      .map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls ?? undefined,
        toolResults: m.toolResults ?? undefined,
        pendingAction: m.pendingAction ?? undefined,
        pendingStatus: m.pendingStatus !== "none" ? m.pendingStatus : undefined,
        thinking: isAdmin ? (m.thinking ?? undefined) : undefined,
        usage: m.inputTokens > 0 ? {
          inputTokens: m.inputTokens,
          outputTokens: m.outputTokens,
          model: m.model,
          durationMs: m.durationMs,
        } : undefined,
        timestamp: m.createdAt?.getTime() ?? Date.now(),
      }))

    res.json(dtos)
  })

  // ─── DELETE /api/ai/conversations/:id ───────────────────────────────────
  router.delete("/api/ai/conversations/:id", withRemult, async (req: any, res: any) => {
    const user = remult.user
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const conv = await remult.repo(AiConversation).findId(req.params.id)
    if (!conv) return res.status(404).json({ error: "Conversation not found" })

    if (!user.roles?.includes("admins") && conv.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Delete messages first
    const messages = await remult.repo(AiMessage).find({ where: { conversationId: conv.id } })
    for (const msg of messages) {
      await remult.repo(AiMessage).delete(msg)
    }
    await remult.repo(AiConversation).delete(conv)

    res.json({ ok: true })
  })

  // ─── GET /api/ai/stats ─────────────────────────────────────────────────
  router.get("/api/ai/stats", withRemult, async (_req: any, res: any) => {
    const user = remult.user
    if (!user?.roles?.includes("admins")) return res.status(403).json({ error: "Forbidden" })

    const conversations = await remult.repo(AiConversation).find({
      orderBy: { createdAt: "desc" },
      limit: 1000,
    })

    const byUser = new Map<string, {
      userId: string
      userName: string
      conversationCount: number
      totalInputTokens: number
      totalOutputTokens: number
      totalDurationMs: number
    }>()

    for (const conv of conversations) {
      const existing = byUser.get(conv.userId) ?? {
        userId: conv.userId,
        userName: conv.userName,
        conversationCount: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalDurationMs: 0,
      }
      existing.conversationCount++
      existing.totalInputTokens += conv.totalInputTokens
      existing.totalOutputTokens += conv.totalOutputTokens
      existing.totalDurationMs += conv.totalDurationMs
      byUser.set(conv.userId, existing)
    }

    res.json(Array.from(byUser.values()))
  })

  return router
}
