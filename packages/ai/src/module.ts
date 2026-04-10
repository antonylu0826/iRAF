import { defineModule } from "@iraf/core"
import { AiConfig } from "./entities/AiConfig.js"
import { AiConfigController } from "./entities/AiConfigController.js"
import { AiConversation } from "./entities/AiConversation.js"
import { AiConversationController } from "./entities/AiConversationController.js"
import { AiMessage } from "./entities/AiMessage.js"

export const AiModule = defineModule({
  key: "ai",
  caption: "AI 助手",
  icon: "Bot",
  entities: [AiConfig, AiConversation, AiMessage],
  controllers: [AiConfigController, AiConversationController],
  menu: [
    { entity: AiConfig, order: 1 },
    { entity: AiConversation, order: 10 },
  ],
  allowedRoles: ["admins"],
  i18n: {
    "zh-TW": {
      "AI 助手": "AI 助手",
      "AI Settings": "AI 設定",
      "AI Conversations": "AI 對話紀錄",
      "AI Messages": "AI 訊息",
      "基本設定": "基本設定",
      "進階設定": "進階設定",
      "存取控制": "存取控制",
      "啟用 AI 助手": "啟用 AI 助手",
      "AI Provider": "AI 提供者",
      "模型": "模型",
      "API Key": "API Key",
      "啟用思考鏈": "啟用思考鏈",
      "最大 Token 數": "最大 Token 數",
      "允許 AI 執行寫入操作": "允許 AI 執行寫入操作",
      "允許使用的角色": "允許使用的角色",
      "自訂系統提示詞": "自訂系統提示詞",
      "標題": "標題",
      "使用者 ID": "使用者",
      "使用者名稱": "使用者名稱",
      "總輸入 Tokens": "總輸入 Tokens",
      "總輸出 Tokens": "總輸出 Tokens",
      "訊息數": "訊息數",
      "總耗時 (ms)": "總耗時 (ms)",
      "取得設定": "取得設定",
      "測試連線": "測試連線",
    },
  },
  onServerInit: async () => {
    // AiConfig saving hook: invalidate provider cache on config change
    const { remult } = await import("remult")
    const repo = remult.repo(AiConfig)

    // We can't add saving hooks after entity registration,
    // but we invalidate on every chat request if needed.
    // The ConfigResolver handles caching internally.
  },
})
