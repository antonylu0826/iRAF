import { remult } from "remult"
import { createId } from "@paralleldrive/cuid2"
import type { IAiContext, IAiSSEEvent, IAiPendingAction, IUserContext, IAiMessageDTO } from "@iraf/core"
import type { IAiProvider, IAiProviderMessage } from "./providers/types.js"
import type { IAiToolDef } from "./tools/types.js"
import { AiConversation } from "./entities/AiConversation.js"
import { AiMessage } from "./entities/AiMessage.js"
import { buildSystemPrompt } from "./context.js"

const MAX_TOOL_LOOPS = 10

export class AiOrchestrator {
  constructor(
    private provider: IAiProvider,
    private tools: IAiToolDef[],
    private config: { maxTokens: number; enableThinking: boolean; customSystemPrompt: string },
  ) {}

  async run(
    conversationId: string | undefined,
    userMessage: string,
    context: IAiContext,
    user: IUserContext,
    emit: (event: IAiSSEEvent) => void,
  ): Promise<void> {
    const convRepo = remult.repo(AiConversation)
    const msgRepo = remult.repo(AiMessage)

    // Create or load conversation
    let conversation: AiConversation
    if (conversationId) {
      const existing = await convRepo.findId(conversationId)
      if (!existing) {
        emit({ type: "error", error: "Conversation not found" })
        return
      }
      conversation = existing
    } else {
      conversation = await convRepo.insert({
        title: userMessage.slice(0, 60),
        userId: user.id ?? "",
        userName: user.name ?? "",
        model: this.provider.name,
      } as any)
      emit({ type: "conversation", conversationId: conversation.id, title: conversation.title })
    }

    // Save user message
    const nextSeq = await this.getNextSeq(conversation.id)
    await msgRepo.insert({
      conversationId: conversation.id,
      role: "user",
      content: userMessage,
      seq: nextSeq,
    } as any)

    // Load full history for LLM context
    const history = await this.loadHistory(conversation.id)
    const systemPrompt = buildSystemPrompt(user, context, this.config.customSystemPrompt)

    // Agentic tool-use loop
    let messages = history
    let loopCount = 0

    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++
      const startTime = Date.now()

      const providerTools = this.tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }))

      const response = await this.provider.chat({
        messages,
        tools: providerTools,
        systemPrompt,
        maxTokens: this.config.maxTokens,
        enableThinking: this.config.enableThinking,
        onChunk: (chunk) => emit({ type: "chunk", content: chunk }),
      })

      const durationMs = Date.now() - startTime

      // No tool calls → final response
      if (response.stopReason !== "tool_use" || response.toolCalls.length === 0) {
        const seq = await this.getNextSeq(conversation.id)
        const saved = await msgRepo.insert({
          conversationId: conversation.id,
          role: "assistant",
          content: response.content,
          thinking: response.thinking ?? null,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          model: response.usage.model,
          durationMs,
          seq,
        } as any)

        await this.updateConversationStats(conversation.id, response.usage.inputTokens, response.usage.outputTokens, durationMs)

        emit({
          type: "message",
          message: this.toDTO(saved),
        })
        emit({
          type: "done",
          usage: { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens, model: response.usage.model, durationMs },
        })
        return
      }

      // Process tool calls
      for (const tc of response.toolCalls) {
        emit({ type: "tool_call", toolCall: tc })

        const tool = this.tools.find(t => t.name === tc.name)
        if (!tool) {
          emit({ type: "tool_result", toolCallId: tc.id, result: `Unknown tool: ${tc.name}`, isError: true })
          messages = [
            ...messages,
            { role: "assistant" as const, content: response.content, toolCalls: response.toolCalls },
            { role: "tool" as const, content: `Unknown tool: ${tc.name}`, toolCallId: tc.id },
          ]
          continue
        }

        // Requires confirmation → pause and wait
        if (tool.requiresConfirmation) {
          const pendingAction: IAiPendingAction = {
            id: createId(),
            toolName: tc.name,
            description: this.describeToolCall(tc),
            input: tc.input,
          }

          const seq = await this.getNextSeq(conversation.id)
          await msgRepo.insert({
            conversationId: conversation.id,
            role: "assistant",
            content: response.content,
            thinking: response.thinking ?? null,
            toolCalls: response.toolCalls,
            pendingAction,
            pendingStatus: "pending",
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            model: response.usage.model,
            durationMs,
            seq,
          } as any)

          await this.updateConversationStats(conversation.id, response.usage.inputTokens, response.usage.outputTokens, durationMs)

          emit({ type: "pending_action", action: pendingAction })
          emit({ type: "done" })
          return
        }

        // Execute tool directly
        const result = await tool.execute(tc.input)
        emit({ type: "tool_result", toolCallId: tc.id, result })

        // Notify frontend to refresh if this tool modified entity data
        const affectedEntityKey = tool.getAffectedEntityKey?.(tc.input)
        if (affectedEntityKey) {
          emit({ type: "data_changed", entityKey: affectedEntityKey })
        }

        // Save tool call + result as messages
        const toolSeq = await this.getNextSeq(conversation.id)
        await msgRepo.insert({
          conversationId: conversation.id,
          role: "assistant",
          content: response.content,
          thinking: response.thinking ?? null,
          toolCalls: [tc],
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          model: response.usage.model,
          durationMs,
          seq: toolSeq,
        } as any)

        const resultSeq = await this.getNextSeq(conversation.id)
        await msgRepo.insert({
          conversationId: conversation.id,
          role: "tool",
          content: result,
          toolResults: [{ toolCallId: tc.id, result }],
          seq: resultSeq,
        } as any)

        await this.updateConversationStats(conversation.id, response.usage.inputTokens, response.usage.outputTokens, durationMs)

        // Continue loop with tool result
        messages = [
          ...messages,
          { role: "assistant" as const, content: response.content, toolCalls: response.toolCalls },
          { role: "tool" as const, content: result, toolCallId: tc.id },
        ]
      }
    }

    emit({ type: "error", error: "Tool loop exceeded maximum iterations" })
  }

  async handleConfirm(
    conversationId: string,
    pendingActionId: string,
    approved: boolean,
    reason: string | undefined,
    context: IAiContext,
    user: IUserContext,
    emit: (event: IAiSSEEvent) => void,
  ): Promise<void> {
    const msgRepo = remult.repo(AiMessage)

    // Find the pending message
    const msgs = await msgRepo.find({
      where: { conversationId, pendingStatus: "pending" },
    })
    const pendingMsg = msgs.find(m => m.pendingAction?.id === pendingActionId)
    if (!pendingMsg) {
      emit({ type: "error", error: "Pending action not found" })
      return
    }

    if (approved) {
      // Execute the tool
      const tool = this.tools.find(t => t.name === pendingMsg.pendingAction!.toolName)
      if (!tool) {
        emit({ type: "error", error: `Tool '${pendingMsg.pendingAction!.toolName}' not found` })
        return
      }

      const result = await tool.execute(pendingMsg.pendingAction!.input)
      emit({ type: "tool_result", toolCallId: pendingMsg.toolCalls?.[0]?.id ?? "", result })

      // Notify frontend to refresh entity data
      const affectedEntityKey = tool.getAffectedEntityKey?.(pendingMsg.pendingAction!.input)
      if (affectedEntityKey) {
        emit({ type: "data_changed", entityKey: affectedEntityKey })
      }

      // Update pending status
      pendingMsg.pendingStatus = "approved"
      await msgRepo.save(pendingMsg)

      // Save tool result
      const seq = await this.getNextSeq(conversationId)
      await msgRepo.insert({
        conversationId,
        role: "tool",
        content: result,
        toolResults: [{ toolCallId: pendingMsg.toolCalls?.[0]?.id ?? "", result }],
        seq,
      } as any)

      // Continue the conversation — AI will see the tool result and respond
      await this.run(conversationId, `[系統] 使用者已確認操作「${pendingMsg.pendingAction!.description}」，結果：${result}`, context, user, emit)
    } else {
      pendingMsg.pendingStatus = "rejected"
      await msgRepo.save(pendingMsg)

      const rejectText = reason
        ? `使用者拒絕了操作「${pendingMsg.pendingAction!.description}」，原因：${reason}`
        : `使用者拒絕了操作「${pendingMsg.pendingAction!.description}」`

      await this.run(conversationId, `[系統] ${rejectText}`, context, user, emit)
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async loadHistory(conversationId: string): Promise<IAiProviderMessage[]> {
    const msgRepo = remult.repo(AiMessage)
    const msgs = await msgRepo.find({
      where: { conversationId },
      orderBy: { seq: "asc" },
    })

    const result: IAiProviderMessage[] = []
    for (const m of msgs) {
      if (m.role === "user") {
        result.push({ role: "user", content: m.content })
      } else if (m.role === "assistant") {
        result.push({
          role: "assistant",
          content: m.content,
          toolCalls: m.toolCalls ?? undefined,
        })
      } else if (m.role === "tool") {
        const toolCallId = m.toolResults?.[0]?.toolCallId ?? ""
        result.push({ role: "tool", content: m.content, toolCallId })
      }
    }
    return result
  }

  private async getNextSeq(conversationId: string): Promise<number> {
    const msgRepo = remult.repo(AiMessage)
    const count = await msgRepo.count({ conversationId })
    return count + 1
  }

  private async updateConversationStats(
    conversationId: string,
    inputTokens: number,
    outputTokens: number,
    durationMs: number,
  ): Promise<void> {
    const convRepo = remult.repo(AiConversation)
    const conv = await convRepo.findId(conversationId)
    if (!conv) return
    conv.totalInputTokens += inputTokens
    conv.totalOutputTokens += outputTokens
    conv.totalDurationMs += durationMs
    conv.messageCount = await remult.repo(AiMessage).count({ conversationId })
    conv.model = this.provider.name
    conv.lastMessageAt = new Date()
    await convRepo.save(conv)
  }

  private describeToolCall(tc: { name: string; input: Record<string, any> }): string {
    switch (tc.name) {
      case "call_action":
        return `呼叫動作 ${tc.input.actionName} on ${tc.input.entityKey} (ID: ${tc.input.recordId})`
      case "create_record":
        return `在 ${tc.input.entityKey} 建立新記錄`
      case "update_record":
        return `更新 ${tc.input.entityKey} 記錄 (ID: ${tc.input.id})`
      default:
        return `執行 ${tc.name}`
    }
  }

  private toDTO(msg: AiMessage): IAiMessageDTO {
    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      toolCalls: msg.toolCalls ?? undefined,
      toolResults: msg.toolResults ?? undefined,
      pendingAction: msg.pendingAction ?? undefined,
      thinking: msg.thinking ?? undefined,
      usage: msg.inputTokens > 0 ? {
        inputTokens: msg.inputTokens,
        outputTokens: msg.outputTokens,
        model: msg.model,
        durationMs: msg.durationMs,
      } : undefined,
      timestamp: msg.createdAt?.getTime() ?? Date.now(),
    }
  }
}
