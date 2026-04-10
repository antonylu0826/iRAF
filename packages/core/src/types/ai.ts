// packages/core/src/types/ai.ts
// Shared AI types used by both server (@iraf/ai) and client (@iraf/react).

// ─── Page context (client → server) ─────────────────────────────────────────

export interface IAiContext {
  currentModule?: string
  currentEntity?: string
  currentRecordId?: string
  currentView?: "list" | "detail" | "dashboard"
}

// ─── Chat request / confirm ─────────────────────────────────────────────────

export interface IAiChatRequest {
  conversationId?: string
  message: string
  context: IAiContext
}

export interface IAiConfirmRequest {
  conversationId: string
  pendingActionId: string
  approved: boolean
  reason?: string
}

// ─── SSE event types ────────────────────────────────────────────────────────

export interface IAiToolCallInfo {
  id: string
  name: string
  input: Record<string, any>
}

export interface IAiPendingAction {
  id: string
  toolName: string
  description: string
  input: Record<string, any>
  preview?: Record<string, any>
}

export interface IAiUsage {
  inputTokens: number
  outputTokens: number
  model: string
  durationMs: number
}

export interface IAiMessageDTO {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: IAiToolCallInfo[]
  toolResults?: Array<{ toolCallId: string; result: string; isError?: boolean }>
  pendingAction?: IAiPendingAction
  usage?: IAiUsage
  thinking?: string
  timestamp: number
}

export type IAiSSEEvent =
  | { type: "chunk"; content: string }
  | { type: "tool_call"; toolCall: IAiToolCallInfo }
  | { type: "tool_result"; toolCallId: string; result: string; isError?: boolean }
  | { type: "pending_action"; action: IAiPendingAction }
  | { type: "message"; message: IAiMessageDTO }
  | { type: "conversation"; conversationId: string; title: string }
  | { type: "error"; error: string }
  | { type: "done"; usage?: IAiUsage }

// ─── Status (for frontend toggle visibility) ────────────────────────────────

export interface IAiStatus {
  enabled: boolean
  hasAccess: boolean
}
