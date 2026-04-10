// Provider abstraction — unified interface across Anthropic / OpenAI / Gemini

export interface IAiProviderRequest {
  messages: IAiProviderMessage[]
  tools: IAiProviderTool[]
  systemPrompt: string
  model?: string
  maxTokens?: number
  enableThinking?: boolean
  onChunk?: (chunk: string) => void
}

export interface IAiProviderMessage {
  role: "user" | "assistant" | "tool"
  content: string
  toolCallId?: string
  toolCalls?: Array<{ id: string; name: string; input: Record<string, any> }>
}

export interface IAiProviderTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface IAiProviderResponse {
  content: string
  toolCalls: Array<{ id: string; name: string; input: Record<string, any> }>
  thinking?: string
  usage: {
    inputTokens: number
    outputTokens: number
    model: string
  }
  stopReason: "end_turn" | "tool_use" | "max_tokens"
}

export interface IAiProvider {
  readonly name: string
  chat(request: IAiProviderRequest): Promise<IAiProviderResponse>
}

export const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.5-flash",
}
