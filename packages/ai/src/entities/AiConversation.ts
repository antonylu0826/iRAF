import { iEntity, iField, BaseObject } from "@iraf/core"
import { remult } from "remult"

/**
 * AiConversation — stores AI chat conversations.
 *
 * Each conversation belongs to a user. Non-admin users can only see their own
 * conversations via apiPrefilter.
 */
@iEntity("ai-conversations", {
  caption: "AI Conversations",
  icon: "MessageSquare",
  allowedRoles: {
    read: ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins"],
    delete: ["admins"],
  },
  defaultOrder: { createdAt: "desc" },
})
export class AiConversation extends BaseObject {
  @iField.string({ caption: "標題", order: 1 })
  title = ""

  @iField.string({ caption: "使用者 ID", order: 2, ref: "users", refLabel: "displayName" })
  userId = ""

  @iField.string({ caption: "使用者名稱", order: 3, readOnly: true })
  userName = ""

  @iField.string({ caption: "模型", order: 4, readOnly: true })
  model = ""

  @iField.number({ caption: "總輸入 Tokens", order: 10, readOnly: true })
  totalInputTokens = 0

  @iField.number({ caption: "總輸出 Tokens", order: 11, readOnly: true })
  totalOutputTokens = 0

  @iField.number({ caption: "訊息數", order: 12, readOnly: true })
  messageCount = 0

  @iField.number({ caption: "總耗時 (ms)", order: 13, readOnly: true })
  totalDurationMs = 0
}
