import { iEntity, iField, BaseObject } from "@iraf/core"
import type { IAiToolCallInfo, IAiPendingAction } from "@iraf/core"

/**
 * AiMessage — stores individual messages within an AI conversation.
 *
 * Records the full audit trail: content, thinking chain, tool calls,
 * tool results, pending actions, token usage, model, and latency.
 */
@iEntity("ai-messages", {
  caption: "AI Messages",
  icon: "MessageCircle",
  allowedRoles: {
    read: ["admins"],
    create: [],
    update: [],
    delete: ["admins"],
  },
  defaultOrder: { seq: "asc" },
})
export class AiMessage extends BaseObject {
  @iField.string({ caption: "對話 ID", order: 1, ref: "ai-conversations" })
  conversationId = ""

  @iField.string({
    caption: "角色",
    order: 2,
    options: ["user", "assistant", "tool"],
  })
  role: "user" | "assistant" | "tool" = "user"

  @iField.string({ caption: "內容", order: 3, control: "textarea" })
  content = ""

  @iField.json({ caption: "思考鏈", hidden: true, order: 20 })
  thinking: string | null = null

  @iField.json({ caption: "Tool Calls", hidden: true, order: 21 })
  toolCalls: IAiToolCallInfo[] | null = null

  @iField.json({ caption: "Tool Results", hidden: true, order: 22 })
  toolResults: Array<{ toolCallId: string; result: string; isError?: boolean }> | null = null

  @iField.json({ caption: "Pending Action", hidden: true, order: 23 })
  pendingAction: IAiPendingAction | null = null

  @iField.string({
    caption: "Pending 狀態",
    order: 24,
    options: ["none", "pending", "approved", "rejected"],
  })
  pendingStatus: "none" | "pending" | "approved" | "rejected" = "none"

  @iField.number({ caption: "輸入 Tokens", order: 30, readOnly: true })
  inputTokens = 0

  @iField.number({ caption: "輸出 Tokens", order: 31, readOnly: true })
  outputTokens = 0

  @iField.string({ caption: "模型", order: 32, readOnly: true })
  model = ""

  @iField.number({ caption: "耗時 (ms)", order: 33, readOnly: true })
  durationMs = 0

  @iField.number({ caption: "順序", order: 40, readOnly: true })
  seq = 0
}
