# iRAF AI Panel 規劃

> 決策紀錄（2026-04-10）：
> - Package 結構：獨立 `packages/ai`
> - 對話持久化：要存（`AiConversation` + `AiMessage` entities）
> - AI 操作確認：要有確認機制（AI 提議 → 使用者確認 → 執行）
> - 模型選擇：支援各家（Anthropic / OpenAI / Gemini），server 端設定，不給 user 選
> - Token / 費用控制：初期不限制，但要有使用量統計，管理者可查看對話紀錄、思考鏈、工具使用情形
> - 設定管理：管理者在系統 UI 設定 AI 開關、Provider、API Key 等，不透過 .env

---

## 架構選擇：Server-side Proxy

```
┌─────────┐     ┌──────────────┐     ┌───────────────┐
│ AI Panel │────→│ iRAF Server  │────→│ Anthropic     │
│ (React)  │     │ /api/ai/chat │     │ OpenAI        │
│          │     │ (tool-use    │     │ Gemini        │
└──────────┘     │  executor)   │     └───────────────┘
                 │              │
                 │  持久化 ──→ DB│
                 └──────────────┘
```

**選擇理由：**

1. **API Key 安全**：LLM API key 不暴露到前端
2. **Tool 執行效率**：server 直接用 remult repo，不繞 HTTP
3. **權限控制統一**：用 remult 的 `getUser()` 確保 AI 只存取該使用者有權限的資料
4. **Streaming**：server 用 SSE 推 streaming response 到前端
5. **多模型**：server 端 adapter，前端無感切換
6. **審計**：所有對話、tool calls、token 用量統一在 server 端寫入 DB

---

## Package 結構

```
packages/
  core/
    src/types/ai.ts              # 共用型別（前後端共用）
    src/types/services.ts        # 新增 SERVICE_KEYS.AI

  react/
    src/components/AiPanel/
      AiPanel.tsx                # 主面板（對話 UI）
      AiToggle.tsx               # appbar slot 按鈕（開關面板）
      AiContext.tsx              # React context（頁面感知）
      MessageBubble.tsx          # 訊息氣泡（markdown + code block）
      ToolCallCard.tsx           # tool call 透明化卡片（可摺疊）
      ActionConfirmCard.tsx      # 操作確認卡片（確認/拒絕）
      ConversationList.tsx       # 歷史對話列表（側邊）
      useAiChat.ts               # 對話 hook（SSE streaming + 持久化）
    src/components/AppShell.tsx  # 修改：加入右側面板

  ai/                            # 獨立 package: @iraf/ai
    src/
      index.ts                   # export createAiRouter()
      router.ts                  # Express router: /api/ai/*
      providers/
        types.ts                 # ILLMProvider（LLM 層抽象）
        claude.ts                # Anthropic SDK adapter
        openai.ts                # OpenAI SDK adapter
        gemini.ts                # Google Generative AI adapter
        factory.ts               # createProvider() — 根據 AiConfig 動態建立 provider
      tools/
        queryEntity.ts           # 查詢任意 entity
        getSchema.ts             # 取得 entity metadata
        callAction.ts            # 呼叫 @iAction（含確認流程）
        createRecord.ts          # 建立記錄（含確認流程）
        updateRecord.ts          # 更新記錄（含確認流程）
        index.ts                 # tool registry + 權限過濾
      entities/
        AiConfig.ts              # 系統設定 entity（singleton：啟用、provider、API key 等）
        AiConversation.ts        # 對話 entity
        AiMessage.ts             # 訊息 entity（含 tool calls + token 用量）
      context.ts                 # system prompt 建構
      orchestrator.ts            # agentic loop（tool-use 迴圈 + 確認中斷）
      configResolver.ts          # 從 DB 讀取 AiConfig，快取 + 建立 provider instance
      module.ts                  # defineModule() — 註冊 entities + admin 管理介面
    package.json
    tsup.config.ts
```

---

## 1. 型別定義（packages/core/src/types/ai.ts）

```typescript
// ─── 前後端共用型別 ───────────────────────────────────────────

export interface IAiContext {
  currentModule?: string        // "sample"
  currentEntity?: string        // "feature-gallery"
  currentRecordId?: string      // "clx..."
  currentView?: "list" | "detail" | "dashboard"
}

/** 前端 → server 的請求 */
export interface IAiChatRequest {
  conversationId?: string       // 續接既有對話；undefined = 新對話
  message: string               // 使用者輸入
  context: IAiContext
}

/** 前端 → server：確認/拒絕待確認操作 */
export interface IAiConfirmRequest {
  conversationId: string
  pendingActionId: string
  approved: boolean
  reason?: string               // 拒絕時可附原因
}

// ─── SSE 事件型別 ──────────────────────────────────────────────

export type IAiSSEEvent =
  | { type: "chunk"; content: string }
  | { type: "tool_call"; toolCall: IAiToolCallInfo }
  | { type: "tool_result"; toolCallId: string; result: string; isError?: boolean }
  | { type: "pending_action"; action: IAiPendingAction }
  | { type: "message"; message: IAiMessageDTO }
  | { type: "conversation"; conversationId: string; title: string }
  | { type: "error"; error: string }
  | { type: "done"; usage: IAiUsage }

export interface IAiToolCallInfo {
  id: string
  name: string
  input: Record<string, any>
}

/** AI 提議的待確認操作 */
export interface IAiPendingAction {
  id: string                    // pending action ID
  toolName: string              // "create_record" | "update_record" | "call_action"
  description: string           // AI 生成的人類可讀描述
  input: Record<string, any>    // 完整參數（供使用者檢視）
  preview?: Record<string, any> // 預覽資料（例：即將建立的記錄內容）
}

export interface IAiUsage {
  inputTokens: number
  outputTokens: number
  model: string
  durationMs: number
}

/** 前端顯示用的訊息 DTO */
export interface IAiMessageDTO {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: IAiToolCallInfo[]
  toolResults?: Array<{ toolCallId: string; result: string; isError?: boolean }>
  pendingAction?: IAiPendingAction
  usage?: IAiUsage
  thinking?: string             // AI 思考鏈（管理者可見）
  timestamp: number
}

// ─── Server-side 型別 ─────────────────────────────────────────

/** LLM provider interface（packages/ai 內部用） */
export interface IAiProvider {
  readonly name: string         // "anthropic" | "openai" | "gemini"
  chat(request: IAiProviderRequest): Promise<IAiProviderResponse>
}

export interface IAiProviderRequest {
  messages: Array<{ role: string; content: any }>
  tools: IAiProviderTool[]
  systemPrompt: string
  model?: string
  maxTokens?: number
  onChunk?: (chunk: string) => void
}

export interface IAiProviderTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface IAiProviderResponse {
  content: string
  toolCalls: IAiToolCallInfo[]
  thinking?: string
  usage: IAiUsage
  stopReason: "end_turn" | "tool_use" | "max_tokens"
}

/** Tool definition（server-side） */
export interface IAiToolDef {
  name: string
  description: string
  inputSchema: Record<string, any>  // JSON Schema
  /** 是否為寫入操作（需要使用者確認） */
  requiresConfirmation?: boolean
  execute: (input: Record<string, any>) => Promise<string>
}
```

---

## 2. 持久化 Entities（packages/ai/src/entities/）

### 2.1 AiConversation

```typescript
@iEntity("ai-conversations", {
  caption: "AI Conversations",
  icon: "MessageSquare",
  allowedRoles: {
    // 一般使用者只能看自己的（透過 apiPrefilter）
    // admins 可看全部
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins"],
    delete: ["admins"],
  },
})
export class AiConversation extends BaseObject {
  @iField.string({ caption: "標題", order: 1 })
  title = ""

  @iField.string({ caption: "使用者", ref: "app-users", order: 2 })
  userId = ""

  @iField.string({ caption: "模型", order: 3 })
  model = ""

  @iField.number({ caption: "總輸入 Tokens", order: 10 })
  totalInputTokens = 0

  @iField.number({ caption: "總輸出 Tokens", order: 11 })
  totalOutputTokens = 0

  @iField.number({ caption: "訊息數", order: 12 })
  messageCount = 0

  @iField.number({ caption: "總耗時 (ms)", order: 13 })
  totalDurationMs = 0
}
```

**apiPrefilter：** 在 entity 的 `@iEntity` options 或 module `onServerInit` 中設定：

```typescript
// 非 admin 只能看自己的對話
apiPrefilter: () => {
  if (remult.user?.roles?.includes("admins")) return {}
  return { userId: remult.user?.id }
}
```

### 2.2 AiMessage

```typescript
@iEntity("ai-messages", {
  caption: "AI Messages",
  icon: "MessageCircle",
  allowedRoles: {
    read:   ["admins"],  // 只有管理者可直接查看
    create: [],          // 由 server 內部建立
    update: [],
    delete: ["admins"],
  },
})
export class AiMessage extends BaseObject {
  @iField.string({ caption: "對話", ref: "ai-conversations", order: 1 })
  conversationId = ""

  @iField.string({ caption: "角色", options: ["user", "assistant", "tool"], order: 2 })
  role: "user" | "assistant" | "tool" = "user"

  @iField.string({ caption: "內容", control: "textarea", order: 3 })
  content = ""

  /** AI 思考鏈（extended thinking / reasoning） */
  @iField.json({ caption: "思考鏈", hidden: true, order: 20 })
  thinking: string | null = null

  /** AI 呼叫的工具列表 */
  @iField.json({ caption: "Tool Calls", hidden: true, order: 21 })
  toolCalls: IAiToolCallInfo[] | null = null

  /** 工具回傳結果 */
  @iField.json({ caption: "Tool Results", hidden: true, order: 22 })
  toolResults: Array<{ toolCallId: string; result: string; isError?: boolean }> | null = null

  /** 待確認操作（如有） */
  @iField.json({ caption: "Pending Action", hidden: true, order: 23 })
  pendingAction: IAiPendingAction | null = null

  @iField.string({ caption: "Pending 狀態", options: ["none", "pending", "approved", "rejected"], order: 24 })
  pendingStatus: "none" | "pending" | "approved" | "rejected" = "none"

  /** Token 用量（assistant 訊息才有） */
  @iField.number({ caption: "輸入 Tokens", order: 30 })
  inputTokens = 0

  @iField.number({ caption: "輸出 Tokens", order: 31 })
  outputTokens = 0

  @iField.string({ caption: "模型", order: 32 })
  model = ""

  @iField.number({ caption: "耗時 (ms)", order: 33 })
  durationMs = 0

  /** 訊息順序 */
  @iField.number({ caption: "順序", order: 40 })
  seq = 0
}
```

---

## 3. 操作確認機制

### 3.1 流程

```
使用者: 「幫我把訂單 #123 標記為已出貨」
    │
    ▼
AI（tool_use）: call_action({ entityKey: "orders", actionName: "markShipped", recordId: "123" })
    │
    ▼
Server 偵測到 tool.requiresConfirmation === true
    │
    ▼
Server 暫停 tool 執行，透過 SSE 發送 pending_action 事件：
  {
    type: "pending_action",
    action: {
      id: "pa_abc123",
      toolName: "call_action",
      description: "將訂單 #123 標記為已出貨",
      input: { entityKey: "orders", actionName: "markShipped", recordId: "123" },
      preview: { id: "123", caption: "訂單 2026-0042", currentStatus: "processing" }
    }
  }
    │
    ▼
前端顯示確認卡片：
  ┌─────────────────────────────────────────┐
  │ 🔧 AI 提議執行操作                        │
  │                                         │
  │ 將訂單 #123 標記為已出貨                   │
  │                                         │
  │ 目標：訂單 2026-0042                      │
  │ 目前狀態：processing → shipped            │
  │                                         │
  │          [拒絕]  [確認執行]               │
  └─────────────────────────────────────────┘
    │
    ├─ 使用者按「確認」→ POST /api/ai/confirm { approved: true }
    │   → server 執行 tool → 回傳結果給 AI → AI 繼續回覆
    │
    └─ 使用者按「拒絕」→ POST /api/ai/confirm { approved: false, reason: "..." }
        → server 把拒絕結果回傳給 AI → AI 回覆「好的，已取消」
```

### 3.2 Server 端 Orchestrator（agentic loop + 確認中斷）

```typescript
// packages/ai/src/orchestrator.ts

/**
 * Orchestrator 負責：
 * 1. 呼叫 LLM provider
 * 2. 處理 tool_use 迴圈（AI 可能連續呼叫多個工具）
 * 3. 遇到 requiresConfirmation 的工具時，中斷迴圈，等使用者確認
 * 4. 持久化每一步到 AiMessage
 * 5. 記錄 token 用量
 */

export class AiOrchestrator {
  constructor(
    private provider: IAiProvider,
    private tools: IAiToolDef[],
  ) {}

  async run(
    conversationId: string,
    userMessage: string,
    context: IAiContext,
    user: IAuthUser,
    emit: (event: IAiSSEEvent) => void,
  ): Promise<void> {
    const systemPrompt = buildSystemPrompt(user, context)
    const history = await this.loadHistory(conversationId)

    // 存使用者訊息
    await this.saveMessage(conversationId, {
      role: "user",
      content: userMessage,
      seq: history.length + 1,
    })

    // Agentic loop
    let messages = [...history, { role: "user", content: userMessage }]
    let loopCount = 0
    const MAX_LOOPS = 10

    while (loopCount < MAX_LOOPS) {
      loopCount++
      const startTime = Date.now()

      const response = await this.provider.chat({
        messages: this.toProviderFormat(messages),
        tools: this.tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
        systemPrompt,
        onChunk: (chunk) => emit({ type: "chunk", content: chunk }),
      })

      const durationMs = Date.now() - startTime

      // 沒有 tool calls → 最終回覆，結束迴圈
      if (response.stopReason !== "tool_use" || response.toolCalls.length === 0) {
        const msg = await this.saveMessage(conversationId, {
          role: "assistant",
          content: response.content,
          thinking: response.thinking,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          model: response.usage.model,
          durationMs,
          seq: messages.length + 1,
        })
        await this.updateConversationStats(conversationId, response.usage, durationMs)
        emit({ type: "message", message: this.toDTO(msg) })
        emit({ type: "done", usage: response.usage })
        return
      }

      // 有 tool calls → 逐一執行
      for (const tc of response.toolCalls) {
        emit({ type: "tool_call", toolCall: tc })
        const tool = this.tools.find(t => t.name === tc.name)

        if (!tool) {
          emit({ type: "tool_result", toolCallId: tc.id, result: `Unknown tool: ${tc.name}`, isError: true })
          continue
        }

        // ★ 需要確認的操作 → 中斷迴圈
        if (tool.requiresConfirmation) {
          const preview = await this.buildPreview(tc)
          const pendingAction: IAiPendingAction = {
            id: generateId(),
            toolName: tc.name,
            description: await this.describeAction(tc),
            input: tc.input,
            preview,
          }

          // 存 assistant 訊息（含 pending action）
          await this.saveMessage(conversationId, {
            role: "assistant",
            content: response.content,
            thinking: response.thinking,
            toolCalls: response.toolCalls,
            pendingAction,
            pendingStatus: "pending",
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            model: response.usage.model,
            durationMs,
            seq: messages.length + 1,
          })

          emit({ type: "pending_action", action: pendingAction })
          emit({ type: "done", usage: response.usage })
          return  // 等使用者確認，不繼續迴圈
        }

        // 不需確認 → 直接執行
        const result = await tool.execute(tc.input)
        emit({ type: "tool_result", toolCallId: tc.id, result })

        // 把 tool result 加入 messages，繼續迴圈
        messages = [
          ...messages,
          { role: "assistant", content: response.content, toolCalls: response.toolCalls },
          { role: "tool", toolCallId: tc.id, content: result },
        ]
      }

      // 存 assistant 中間訊息（有 tool calls 但不需確認的）
      await this.saveMessage(conversationId, {
        role: "assistant",
        content: response.content,
        thinking: response.thinking,
        toolCalls: response.toolCalls,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        model: response.usage.model,
        durationMs,
        seq: messages.length,
      })
    }

    emit({ type: "error", error: "Tool loop exceeded maximum iterations" })
  }

  /**
   * 使用者確認/拒絕後，恢復 agentic loop
   */
  async handleConfirm(
    conversationId: string,
    pendingActionId: string,
    approved: boolean,
    reason: string | undefined,
    user: IAuthUser,
    context: IAiContext,
    emit: (event: IAiSSEEvent) => void,
  ): Promise<void> {
    // 找到 pending message
    const pendingMsg = await this.findPendingMessage(conversationId, pendingActionId)
    if (!pendingMsg) {
      emit({ type: "error", error: "Pending action not found" })
      return
    }

    if (approved) {
      // 執行 tool
      const tool = this.tools.find(t => t.name === pendingMsg.pendingAction!.toolName)!
      const result = await tool.execute(pendingMsg.pendingAction!.input)

      // 更新 pending 狀態
      pendingMsg.pendingStatus = "approved"
      await remult.repo(AiMessage).save(pendingMsg)

      // 把結果當作 tool result，繼續 agentic loop
      emit({ type: "tool_result", toolCallId: pendingMsg.toolCalls![0].id, result })

      // 繼續跟 AI 對話（把 tool result 送回去）
      await this.run(
        conversationId,
        `[系統] 使用者已確認操作「${pendingMsg.pendingAction!.description}」，結果：${result}`,
        context,
        user,
        emit,
      )
    } else {
      // 拒絕
      pendingMsg.pendingStatus = "rejected"
      await remult.repo(AiMessage).save(pendingMsg)

      const rejectMsg = reason
        ? `使用者拒絕了操作「${pendingMsg.pendingAction!.description}」，原因：${reason}`
        : `使用者拒絕了操作「${pendingMsg.pendingAction!.description}」`

      await this.run(conversationId, `[系統] ${rejectMsg}`, context, user, emit)
    }
  }

  // ... loadHistory, saveMessage, updateConversationStats, toDTO 等私有方法
}
```

---

## 4. 多模型 Provider

### 4.1 統一介面

三家 provider 都實作 `IAiProvider`，差異封裝在 adapter 內部。

```typescript
// packages/ai/src/providers/types.ts
// （IAiProvider 已在 core/types/ai.ts 定義，這裡放 provider 的建構設定）

export interface IAiProviderConfig {
  provider: "anthropic" | "openai" | "gemini"
  apiKey: string
  model?: string          // 每家預設不同
  maxTokens?: number
  /** 啟用 extended thinking（Anthropic）或 reasoning（OpenAI o-series） */
  enableThinking?: boolean
}

export const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.5-flash",
}
```

### 4.2 各家 Adapter 重點差異

| 面向 | Anthropic | OpenAI | Gemini |
|------|-----------|--------|--------|
| SDK | `@anthropic-ai/sdk` | `openai` | `@google/genai` |
| System prompt | `system` 參數 | messages 第一條 `role: "system"` | `systemInstruction` |
| Tool 格式 | `input_schema` | `parameters` (function calling) | `functionDeclarations` |
| Streaming | `messages.stream()` | `chat.completions.create({ stream: true })` | `generateContentStream()` |
| Thinking | `thinking: { type: "enabled" }` | reasoning_effort (o-series) | `thinkingConfig` |
| Tool result | `role: "user"` + `tool_result` block | `role: "tool"` message | `functionResponse` part |
| Token 用量 | `response.usage` | `response.usage` | `response.usageMetadata` |

```typescript
// packages/ai/src/providers/claude.ts（摘要）
export class ClaudeProvider implements IAiProvider {
  readonly name = "anthropic"

  async chat(request: IAiProviderRequest): Promise<IAiProviderResponse> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.systemPrompt,
      messages: request.messages,
      tools: request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
    })
    // ... streaming + 解析 tool_use blocks
  }
}

// packages/ai/src/providers/openai.ts（摘要）
export class OpenAIProvider implements IAiProvider {
  readonly name = "openai"

  async chat(request: IAiProviderRequest): Promise<IAiProviderResponse> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [
        { role: "system", content: request.systemPrompt },
        ...request.messages,
      ],
      tools: request.tools.map(t => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
    })
    // ... streaming + 解析 function_call
  }
}

// packages/ai/src/providers/gemini.ts（摘要）
export class GeminiProvider implements IAiProvider {
  readonly name = "gemini"

  async chat(request: IAiProviderRequest): Promise<IAiProviderResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: request.systemPrompt,
      tools: [{
        functionDeclarations: request.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        })),
      }],
    })
    const result = await model.generateContentStream({ contents: request.messages })
    // ... streaming + 解析 functionCall parts
  }
}
```

### 4.3 系統設定 Entity（AiConfig）

管理者在系統 UI 設定 AI 功能，不透過 .env。`AiConfig` 是一個 **singleton entity**（只有一筆記錄）。

```typescript
// packages/ai/src/entities/AiConfig.ts

@iEntity("ai-config", {
  caption: "AI Settings",
  icon: "Settings2",
  allowedRoles: {
    read:   ["admins"],
    create: ["admins"],
    update: ["admins"],
    delete: [],             // 不允許刪除，只能修改
  },
})
export class AiConfig extends BaseObject {
  /** AI Panel 全域開關 */
  @iField.boolean({ caption: "啟用 AI 助手", order: 1, group: "基本設定" })
  enabled = false

  /** 目前使用的 Provider */
  @iField.string({
    caption: "AI Provider",
    order: 2,
    group: "基本設定",
    options: [
      { value: "anthropic", label: "Anthropic (Claude)" },
      { value: "openai", label: "OpenAI (GPT)" },
      { value: "gemini", label: "Google (Gemini)" },
    ],
  })
  provider: "anthropic" | "openai" | "gemini" = "anthropic"

  /** 模型名稱（留空用該 provider 預設值） */
  @iField.string({
    caption: "模型",
    order: 3,
    group: "基本設定",
    placeholder: "留空使用預設模型",
  })
  model = ""

  /** API Key（加密儲存，UI 顯示遮罩） */
  @iField.string({
    caption: "API Key",
    order: 4,
    group: "基本設定",
    control: "password",    // UI 用 password input 顯示
    required: true,
  })
  apiKeyEncrypted = ""

  /** 啟用思考鏈（extended thinking） */
  @iField.boolean({ caption: "啟用思考鏈", order: 5, group: "進階設定" })
  enableThinking = false

  /** 最大 token 數 */
  @iField.number({ caption: "最大 Token 數", order: 6, group: "進階設定" })
  maxTokens = 4096

  /** 允許 AI 執行寫入操作（需確認） */
  @iField.boolean({ caption: "允許 AI 執行寫入操作", order: 7, group: "進階設定" })
  allowWriteOperations = true

  /** 哪些角色可以使用 AI Panel */
  @iField.json({
    caption: "允許使用的角色",
    order: 8,
    group: "存取控制",
    control: "roles",
  })
  allowedRoles: string[] = ["admins", "managers", "users"]

  /** 自訂 system prompt 附加內容（管理者可加入企業特定指引） */
  @iField.string({
    caption: "自訂系統提示詞",
    order: 9,
    group: "進階設定",
    control: "textarea",
    placeholder: "附加到系統提示詞的內容（可選）",
  })
  customSystemPrompt = ""
}
```

#### API Key 安全處理

API Key 是敏感資料，需要特殊處理：

```typescript
// packages/ai/src/entities/AiConfig.ts — saving hook

// 1. 儲存時加密
@iEntity("ai-config", {
  saving: async (config, lc) => {
    if (lc.isNew || config.apiKeyEncrypted !== "••••••••") {
      // 使用者輸入了新的 key → 加密儲存
      const crypto = await import("crypto")
      const secret = process.env.AI_ENCRYPTION_SECRET || "iraf-default-secret"
      const cipher = crypto.createCipheriv("aes-256-gcm", /* derive key */, /* iv */)
      config.apiKeyEncrypted = encrypt(config.apiKeyEncrypted, secret)
    }
    // 如果值是 "••••••••" 表示使用者沒改，恢復原值
  },
})

// 2. 讀取時遮罩（API 回傳不含明文）
// 透過 apiPrefilter 或 toJson 攔截，把 apiKeyEncrypted 替換為 "••••••••"
// 只有 server 內部的 configResolver 才讀取真實值
```

```
                ┌───────────────────┐
                │     AiConfig      │
  管理者 UI ───→│  apiKeyEncrypted  │←── server 內部讀取（解密）
  （看到 ••••） │  = 加密後的字串    │
                └───────────────────┘
```

**唯一的 .env**：只需要一個 `AI_ENCRYPTION_SECRET`（用來加解密 API Key），這個不適合放 DB。

#### Singleton 機制

AiConfig 只應該有一筆記錄。透過 controller action 確保：

```typescript
// packages/ai/src/entities/AiConfigController.ts

@iController(AiConfig)
export class AiConfigController {
  /** 取得設定（沒有就建立預設） */
  @iAction({ caption: "取得設定", allowedRoles: ["admins"] })
  static async getOrCreate(): Promise<AiConfig> {
    const repo = remult.repo(AiConfig)
    const existing = await repo.findFirst()
    if (existing) return existing
    return repo.insert(repo.create())  // 用預設值建立
  }
}
```

前端的 AI Settings 頁面直接呼叫 `getOrCreate()` 取得設定，修改後 save。

#### ConfigResolver（server-side 快取）

```typescript
// packages/ai/src/configResolver.ts

/**
 * ConfigResolver — 從 DB 讀取 AiConfig，快取 provider instance。
 *
 * - 第一次存取時從 DB 載入 + 建立 provider
 * - AiConfig 被修改時（saving hook 觸發），清除快取
 * - 下次 chat 請求會重新讀取 + 建立新 provider（不需重啟 server）
 */
export class AiConfigResolver {
  private static _cachedConfig: AiConfig | null = null
  private static _cachedProvider: IAiProvider | null = null

  /** 取得目前的 AI provider（從 DB config 動態建立） */
  static async getProvider(): Promise<IAiProvider | null> {
    const config = await this.getConfig()
    if (!config?.enabled) return null

    if (this._cachedProvider) return this._cachedProvider

    const apiKey = decrypt(config.apiKeyEncrypted, process.env.AI_ENCRYPTION_SECRET!)
    this._cachedProvider = createProviderInstance(config.provider, apiKey, {
      model: config.model || undefined,
      maxTokens: config.maxTokens,
      enableThinking: config.enableThinking,
    })
    return this._cachedProvider
  }

  /** 取得目前設定 */
  static async getConfig(): Promise<AiConfig | null> {
    if (this._cachedConfig) return this._cachedConfig
    this._cachedConfig = await remult.repo(AiConfig).findFirst()
    return this._cachedConfig
  }

  /** 清除快取（AiConfig 被修改時呼叫） */
  static invalidate(): void {
    this._cachedConfig = null
    this._cachedProvider = null
  }
}
```

AiConfig 的 saving hook 會呼叫 `AiConfigResolver.invalidate()`，確保下次 chat 請求使用新設定。

#### Router 改動

Router 不再從 ServiceRegistry 拿固定 provider，改為每次請求從 ConfigResolver 動態取得：

```typescript
// packages/ai/src/router.ts（修改後）

router.post("/api/ai/chat", withRemult, async (req, res) => {
  const user = remult.user
  if (!user) return res.status(401).json({ error: "Unauthorized" })

  // 1. 從 DB 讀取設定
  const config = await AiConfigResolver.getConfig()
  if (!config?.enabled) {
    return res.status(503).json({ error: "AI assistant is not enabled" })
  }

  // 2. 檢查使用者角色是否允許使用 AI
  const hasAccess = config.allowedRoles.some(role => user.roles.includes(role))
  if (!hasAccess) {
    return res.status(403).json({ error: "You do not have access to AI assistant" })
  }

  // 3. 取得 provider（從快取或新建）
  const provider = await AiConfigResolver.getProvider()
  if (!provider) {
    return res.status(503).json({ error: "AI provider not configured" })
  }

  // 4. 建立 orchestrator 並執行
  const tools = getAvailableTools(user, config)
  const orchestrator = new AiOrchestrator(provider, tools)
  // ...
})
```

#### 前端：AI Panel 開關感知

前端需要知道 AI 是否啟用（決定是否顯示 toggle 按鈕）：

```typescript
// packages/ai/src/router.ts

// GET /api/ai/status — 任何已登入使用者都可呼叫
router.get("/api/ai/status", withRemult, async (req, res) => {
  const user = remult.user
  if (!user) return res.status(401).json({ enabled: false })

  const config = await AiConfigResolver.getConfig()
  const enabled = config?.enabled ?? false
  const hasAccess = enabled && (config?.allowedRoles ?? []).some(r => user.roles.includes(r))

  res.json({ enabled, hasAccess })
})
```

```typescript
// packages/react/src/components/AiPanel/useAiStatus.ts

export function useAiStatus() {
  const [status, setStatus] = useState<{ enabled: boolean; hasAccess: boolean }>({
    enabled: false,
    hasAccess: false,
  })

  useEffect(() => {
    fetch("/api/ai/status", { headers: { /* auth */ } })
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, hasAccess: false }))
  }, [])

  return status
}
```

`AiToggle`（appbar slot 按鈕）只在 `hasAccess === true` 時渲染。

#### App 層設定（簡化後）

```typescript
// app/src/server/index.ts

import { createAiRouter } from "@iraf/ai"

// 不需要再 register provider — router 內部從 DB 動態取得
app.use(createAiRouter(api.withRemult))
```

```env
# .env — 只需要這一個 AI 相關的環境變數
AI_ENCRYPTION_SECRET=your-32-char-secret-key-here
```

其餘所有設定（provider、API key、模型、開關）都由管理者在系統 UI 完成。

#### 管理者 AI 設定頁面

```
┌─────────────────────────────────────────────────────┐
│ AI Settings                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ── 基本設定 ──────────────────────────────────────── │
│                                                     │
│ 啟用 AI 助手        [✓]                              │
│                                                     │
│ AI Provider         [Anthropic (Claude)     ▾]      │
│                                                     │
│ 模型               [claude-sonnet-4-20250514    ]   │
│                     留空使用預設模型                   │
│                                                     │
│ API Key             [••••••••••••••••••••••••   ]   │
│                                                     │
│ ── 進階設定 ──────────────────────────────────────── │
│                                                     │
│ 啟用思考鏈          [ ]                              │
│                                                     │
│ 最大 Token 數       [4096                       ]   │
│                                                     │
│ 允許 AI 執行寫入操作 [✓]                              │
│                                                     │
│ 自訂系統提示詞       [                           ]   │
│                     [                           ]   │
│                     [                           ]   │
│                                                     │
│ ── 存取控制 ──────────────────────────────────────── │
│                                                     │
│ 允許使用的角色       [✓] admins                      │
│                     [✓] managers                    │
│                     [✓] users                       │
│                                                     │
│                              [儲存]                  │
│                                                     │
│ ── 連線測試 ──────────────────────────────────────── │
│                                                     │
│ [測試連線]  → ✅ 成功：claude-sonnet-4, 回應時間 1.2s │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**連線測試** action：

```typescript
@iAction({ caption: "測試連線", icon: "Zap", allowedRoles: ["admins"] })
static async testConnection(): Promise<{ success: boolean; model: string; latencyMs: number; error?: string }> {
  const provider = await AiConfigResolver.getProvider()
  if (!provider) return { success: false, model: "", latencyMs: 0, error: "Provider not configured" }

  const start = Date.now()
  try {
    const response = await provider.chat({
      messages: [{ role: "user", content: "Reply with: OK" }],
      tools: [],
      systemPrompt: "You are a test. Reply with exactly 'OK'.",
      maxTokens: 10,
    })
    return {
      success: true,
      model: response.usage.model,
      latencyMs: Date.now() - start,
    }
  } catch (err: any) {
    return { success: false, model: "", latencyMs: Date.now() - start, error: err.message }
  }
}
```

---

## 5. 管理者審計介面

### 5.1 需求

管理者（admins 角色）可以：
- 查看所有使用者的 AI 對話列表（篩選：使用者、日期、模型）
- 進入對話詳情，看到完整對話流程
- 展開每條 assistant 訊息的：
  - **思考鏈**（thinking / reasoning）
  - **Tool calls**（呼叫了什麼工具、傳了什麼參數）
  - **Tool results**（工具回傳了什麼）
  - **確認操作紀錄**（使用者確認/拒絕了什麼）
  - **Token 用量**（input/output tokens、模型、耗時）
- 匯總統計：每使用者的總 token 用量、對話數

### 5.2 實作方式

AI entities（`AiConversation`、`AiMessage`）已經透過 `@iEntity` 註冊，管理者可以直接透過 iRAF 的 ListView / DetailView 查看。但對話詳情需要自訂 view（不適合用預設 form）。

```typescript
// packages/ai/src/module.ts
export const AiModule = defineModule({
  key: "ai",
  caption: "AI 助手",
  icon: "Bot",
  entities: [AiConfig, AiConversation, AiMessage],
  controllers: [AiConfigController],
  menu: [
    { entity: AiConfig, order: 1 },          // AI 設定（singleton）
    { entity: AiConversation, order: 10 },   // 對話紀錄
    // AiMessage 不需要獨立入口，從 AiConversation 進入
  ],
  allowedRoles: ["admins"],   // 整個管理介面只有 admins 可見
  i18n: {
    "zh-TW": {
      "AI 助手": "AI 助手",
      "AI Settings": "AI 設定",
      "AI Conversations": "AI 對話紀錄",
      "AI Messages": "AI 訊息",
    },
  },
})
```

**AiConversation 的 DetailView** 用自訂 view plugin，顯示對話時間軸：

```
┌───────────────────────────────────────────────────────┐
│ 對話紀錄：「查詢本月訂單」                               │
│ 使用者：admin │ 模型：claude-sonnet-4 │ 2026-04-10      │
│ Tokens：1,234 in / 567 out │ 耗時：2.3s               │
├───────────────────────────────────────────────────────┤
│                                                       │
│ [user] 這個月有多少筆訂單？                              │
│                                                       │
│ [assistant]                                           │
│   ▸ Thinking: 使用者問的是本月訂單數量，我需要...（摺疊） │
│   ▸ Tool: query_records                               │
│     └ input: { entityKey: "orders", where: {...} }    │
│     └ result: [42 records...] (truncated)             │
│   Content: 這個月共有 42 筆訂單...                      │
│   Tokens: 890 in / 234 out │ 1.2s                     │
│                                                       │
│ [user] 幫我把訂單 #123 標記為已出貨                      │
│                                                       │
│ [assistant]                                           │
│   ▸ Tool: call_action (⚠️ 需確認)                     │
│     └ input: { entityKey: "orders", ... }             │
│     └ 狀態: ✅ 已確認                                  │
│     └ result: Action completed.                       │
│   Content: 已將訂單 #123 標記為已出貨。                  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 5.3 統計 API

```typescript
// packages/ai/src/router.ts（管理者端點）

// GET /api/ai/stats — 使用量統計
router.get("/api/ai/stats", withRemult, async (req, res) => {
  if (!remult.user?.roles?.includes("admins")) {
    return res.status(403).json({ error: "Forbidden" })
  }

  const conversations = await remult.repo(AiConversation).find({
    orderBy: { createdAt: "desc" },
    limit: 1000,
  })

  // 按使用者分組統計
  const byUser = new Map<string, {
    userId: string
    conversationCount: number
    totalInputTokens: number
    totalOutputTokens: number
    totalDurationMs: number
  }>()

  for (const conv of conversations) {
    const existing = byUser.get(conv.userId) ?? {
      userId: conv.userId,
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
```

---

## 6. 前端 UI

### 6.1 AppShell 改造

```
┌────┬──────────────────────────────┬────────────────┐
│Side│         Main Content         │   AI Panel     │
│bar │                              │   (w: 400px)   │
│    │  ┌──────────────────────┐    │                │
│    │  │  ListView / Detail   │    │  ┌──────────┐  │
│    │  │                      │    │  │ 歷史對話  │  │
│    │  │                      │    │  ├──────────┤  │
│    │  │                      │    │  │          │  │
│    │  │                      │    │  │ 訊息區域  │  │
│    │  │                      │    │  │          │  │
│    │  │                      │    │  ├──────────┤  │
│    │  │                      │    │  │ 輸入框   │  │
│    │  └──────────────────────┘    │  └──────────┘  │
│    │                              │                │
└────┴──────────────────────────────┴────────────────┘
                                     ↑ 可收合/展開
```

### 6.2 AiPanel 元件結構

```
AiPanel
├── ConversationList         # 歷史對話列表（可收合的子面板）
│   ├── 搜尋框
│   └── 對話項目 × N         # 標題 + 時間 + 訊息數
├── MessageArea              # 對話訊息區（可捲動）
│   ├── MessageBubble (user)
│   ├── MessageBubble (assistant)
│   │   ├── ToolCallCard     # 可摺疊的 tool call 卡片
│   │   └── ActionConfirmCard # 確認/拒絕操作的 UI
│   └── StreamingIndicator   # 打字機效果
└── InputArea
    ├── 文字輸入框（支援 Shift+Enter 換行）
    └── 送出按鈕
```

### 6.3 useAiChat Hook（含持久化 + 確認）

```typescript
// packages/react/src/components/AiPanel/useAiChat.ts

export function useAiChat() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<IAiMessageDTO[]>([])
  const [streaming, setStreaming] = useState(false)
  const [pendingAction, setPendingAction] = useState<IAiPendingAction | null>(null)
  const context = useAiContext()

  /** 送出訊息 */
  const send = useCallback(async (userMessage: string) => {
    // ... POST /api/ai/chat，SSE streaming
    // 解析 SSE 事件，更新 messages / pendingAction
    // 收到 conversation 事件時更新 conversationId
  }, [conversationId, messages, context])

  /** 確認操作 */
  const confirmAction = useCallback(async (approved: boolean, reason?: string) => {
    if (!pendingAction || !conversationId) return
    setPendingAction(null)

    // POST /api/ai/confirm
    const res = await fetch("/api/ai/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", /* auth */ },
      body: JSON.stringify({
        conversationId,
        pendingActionId: pendingAction.id,
        approved,
        reason,
      }),
    })

    // 繼續接收 SSE streaming（server 會繼續 agentic loop）
    // ...
  }, [conversationId, pendingAction])

  /** 載入歷史對話 */
  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/ai/conversations/${id}/messages`, { /* auth */ })
    const msgs = await res.json()
    setConversationId(id)
    setMessages(msgs)
  }, [])

  /** 開始新對話 */
  const newConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setPendingAction(null)
  }, [])

  return {
    conversationId,
    messages,
    streaming,
    pendingAction,
    send,
    confirmAction,
    loadConversation,
    newConversation,
  }
}
```

### 6.4 操作確認卡片

```
┌─────────────────────────────────────────┐
│ ⚡ AI 提議執行操作                        │
│                                         │
│ 將訂單 「2026-0042」 標記為已出貨           │
│                                         │
│ ┌─ 詳情 ──────────────────────────────┐ │
│ │ 動作：call_action                   │ │
│ │ Entity: orders                      │ │
│ │ Action: markShipped                 │ │
│ │ 目標記錄: 2026-0042 (processing)    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  [拒絕]                  [確認執行]      │
└─────────────────────────────────────────┘
```

---

## 7. Router 完整端點

```
GET    /api/ai/status                  # AI 啟用狀態 + 使用者是否有權限（任何已登入使用者）

POST   /api/ai/chat                    # 送出訊息（SSE streaming）
POST   /api/ai/confirm                 # 確認/拒絕待確認操作

GET    /api/ai/conversations           # 列出使用者的對話（一般使用者只看自己的）
GET    /api/ai/conversations/:id       # 取得對話詳情
DELETE /api/ai/conversations/:id       # 刪除對話（一般使用者只能刪自己的）
GET    /api/ai/conversations/:id/messages  # 取得對話的所有訊息

GET    /api/ai/stats                   # 使用量統計（admins only）

# AiConfig 透過 remult 標準 CRUD endpoint（/api/ai-config）
# AiConfigController.testConnection() → POST /api/AiConfigController/testConnection
```

---

## 8. 與現有系統的整合

| 整合點 | 做法 |
|--------|------|
| **權限** | remult.user 做權限檢查；apiPrefilter 讓一般使用者只看自己的對話 |
| **i18n** | system prompt 讀取使用者語系偏好 |
| **MCP 共用** | AI tools 與 MCP tools 邏輯相同，可抽共用函式 |
| **EventBus** | AI 執行寫入操作後 emit event，主頁面的 ListView/DetailView 自動刷新 |
| **AiConfig** | 管理者在 UI 設定 provider / API key / 開關；ConfigResolver 快取 + 動態建立 provider |
| **SlotArea** | AI toggle 按鈕註冊為 `slot: "appbar:ai-toggle"` |
| **ModuleRegistry** | AiModule 註冊到 app，admins 在側邊欄看到「AI 助手」管理入口 |

---

## 9. 實作里程碑

### Phase 1: 基礎骨架 + 系統設定
- [ ] `packages/core/src/types/ai.ts` — 共用型別
- [ ] `packages/ai/` — package 骨架（package.json, tsup.config.ts）
- [ ] `packages/ai/src/entities/AiConfig.ts` — 設定 entity（singleton）
- [ ] `packages/ai/src/entities/AiConversation.ts` — 對話 entity
- [ ] `packages/ai/src/entities/AiMessage.ts` — 訊息 entity
- [ ] `packages/ai/src/entities/AiConfigController.ts` — getOrCreate + testConnection
- [ ] `packages/ai/src/configResolver.ts` — DB 設定快取 + provider 動態建立
- [ ] `packages/ai/src/module.ts` — defineModule（含 AiConfig + AiConversation + AiMessage）
- [ ] `app/src/modules/index.ts` — 追加 AiModule
- [ ] 管理者可在 UI 設定 provider / API key / 開關 / 角色

### Phase 2: Provider + Orchestrator
- [ ] `packages/ai/src/providers/claude.ts` — Anthropic adapter
- [ ] `packages/ai/src/providers/openai.ts` — OpenAI adapter
- [ ] `packages/ai/src/providers/gemini.ts` — Gemini adapter
- [ ] `packages/ai/src/providers/factory.ts` — createProviderInstance()
- [ ] `packages/ai/src/orchestrator.ts` — agentic loop + 持久化 + 確認中斷
- [ ] `packages/ai/src/context.ts` — system prompt 建構（含 customSystemPrompt）
- [ ] AiConfigController.testConnection — 連線測試 action

### Phase 3: Server Tools + Router
- [ ] `packages/ai/src/tools/queryEntity.ts`
- [ ] `packages/ai/src/tools/getSchema.ts`
- [ ] `packages/ai/src/tools/callAction.ts`（含 requiresConfirmation，受 config.allowWriteOperations 控制）
- [ ] `packages/ai/src/tools/createRecord.ts`（含 requiresConfirmation）
- [ ] `packages/ai/src/tools/updateRecord.ts`（含 requiresConfirmation）
- [ ] `packages/ai/src/router.ts` — 全部端點（含 /api/ai/status）
- [ ] App 接線（server/index.ts — 只需 `app.use(createAiRouter(api.withRemult))`）

### Phase 4: 前端 UI
- [ ] `useAiStatus.ts` — 查詢 AI 啟用狀態（決定是否顯示 toggle）
- [ ] `AiContext.tsx` — 頁面感知 context provider
- [ ] `useAiChat.ts` — SSE streaming + 持久化 + 確認
- [ ] `AiPanel.tsx` — 主面板
- [ ] `AiToggle.tsx` — appbar slot 按鈕（根據 useAiStatus 條件渲染）
- [ ] `MessageBubble.tsx` — markdown 訊息（含 streaming 效果）
- [ ] `ToolCallCard.tsx` — tool call 可摺疊卡片
- [ ] `ActionConfirmCard.tsx` — 確認/拒絕操作 UI
- [ ] `ConversationList.tsx` — 歷史對話列表
- [ ] `AppShell.tsx` 修改 — 右側面板

### Phase 5: 管理者審計
- [ ] AiConversation 自訂 DetailView（對話時間軸 + 思考鏈展開）
- [ ] 統計 API + 統計頁面
- [ ] 按使用者 / 日期 / 模型篩選
