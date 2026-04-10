import { iController, iAction } from "@iraf/core"
import { remult } from "remult"
import { AiConfig } from "./AiConfig.js"
import { AiConfigResolver } from "../configResolver.js"

@iController(AiConfig)
export class AiConfigController {
  @iAction({
    caption: "取得設定",
    icon: "Settings2",
    allowedRoles: ["admins"],
  })
  static async getOrCreate(): Promise<string> {
    const repo = remult.repo(AiConfig)
    const existing = await repo.findFirst()
    if (existing) return existing.id
    const created = await repo.insert(repo.create())
    return created.id
  }

  @iAction({
    caption: "測試連線",
    icon: "Zap",
    allowedRoles: ["admins"],
  })
  static async testConnection(id: string): Promise<void> {
    // Force re-read config
    AiConfigResolver.invalidate()
    const provider = await AiConfigResolver.getProvider()
    if (!provider) {
      throw new Error("AI Provider 未設定或未啟用。請先設定 API Key 並啟用 AI 助手。")
    }

    const start = Date.now()
    try {
      await provider.chat({
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        tools: [],
        systemPrompt: "You are a connection test. Reply with exactly 'OK'.",
        maxTokens: 10,
      })
      const latencyMs = Date.now() - start
      // Action completed successfully — DetailView will show success notification
      console.log(`[AI] Connection test OK (${provider.name}, ${latencyMs}ms)`)
    } catch (err: any) {
      throw new Error(`連線失敗：${err.message}`)
    }
  }
}
