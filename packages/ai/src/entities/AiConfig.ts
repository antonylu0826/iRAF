import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * AiConfig — singleton entity for AI Panel system settings.
 *
 * Only one record should exist. Managed via AiConfigController.getOrCreate().
 * Admins configure provider, API key, model, and access control here.
 */
@iEntity("ai-config", {
  caption: "AI Settings",
  icon: "Settings2",
  allowedRoles: {
    read: ["admins"],
    create: ["admins"],
    update: ["admins"],
    delete: [],
  },
})
export class AiConfig extends BaseObject {
  @iField.boolean({ caption: "啟用 AI 助手", order: 1, group: "基本設定" })
  enabled = false

  @iField.string({
    caption: "AI Provider",
    order: 2,
    group: "基本設定",
    options: [
      { id: "anthropic", caption: "Anthropic (Claude)" },
      { id: "openai", caption: "OpenAI (GPT)" },
      { id: "gemini", caption: "Google (Gemini)" },
    ],
  })
  provider: "anthropic" | "openai" | "gemini" = "anthropic"

  @iField.string({
    caption: "模型",
    order: 3,
    group: "基本設定",
    placeholder: "留空使用預設模型",
  })
  model = ""

  @iField.string({
    caption: "API Key",
    order: 4,
    group: "基本設定",
    control: "password",
  })
  apiKey = ""

  @iField.boolean({ caption: "啟用思考鏈", order: 5, group: "進階設定" })
  enableThinking = false

  @iField.number({ caption: "最大 Token 數", order: 6, group: "進階設定" })
  maxTokens = 4096

  @iField.boolean({ caption: "允許 AI 執行寫入操作", order: 7, group: "進階設定" })
  allowWriteOperations = true

  @iField.json({
    caption: "允許使用的角色",
    order: 8,
    group: "存取控制",
    control: "roles",
  })
  allowedUserRoles: string[] = ["admins", "managers", "users"]

  @iField.string({
    caption: "自訂系統提示詞",
    order: 9,
    group: "進階設定",
    control: "textarea",
    placeholder: "附加到系統提示詞的內容（可選）",
  })
  customSystemPrompt = ""
}
