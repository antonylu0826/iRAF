import { iController, iAction } from "@iraf/core"
import { remult } from "remult"
import type { IAiMessageDTO } from "@iraf/core"
import { AiConversation } from "./AiConversation.js"
import { AiMessage } from "./AiMessage.js"

@iController(AiConversation)
export class AiConversationController {
  /**
   * viewMessages — returns all messages in this conversation as DTOs.
   * DetailView opens them in a read-only drawer (resultView: "drawer").
   */
  @iAction({
    caption: "查看對話內容",
    icon: "MessageSquare",
    allowedRoles: ["admins"],
    resultView: "drawer",
  })
  static async viewMessages(id: string): Promise<IAiMessageDTO[]> {
    const messages = await remult.repo(AiMessage).find({
      where: { conversationId: id },
      orderBy: { seq: "asc" },
    })

    return messages
      .filter(m => m.role !== "tool")
      .map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        toolCalls: m.toolCalls ?? undefined,
        toolResults: m.toolResults ?? undefined,
        thinking: m.thinking ?? undefined,
        usage: m.inputTokens > 0
          ? {
            inputTokens: m.inputTokens,
            outputTokens: m.outputTokens,
            model: m.model,
            durationMs: m.durationMs,
          }
          : undefined,
        timestamp: m.createdAt?.getTime() ?? 0,
      }))
  }
}
