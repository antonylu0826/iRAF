import OpenAI from "openai"
import type { IAiProvider, IAiProviderRequest, IAiProviderResponse } from "./types.js"
import { DEFAULT_MODELS } from "./types.js"

export class OpenAIProvider implements IAiProvider {
  readonly name = "openai"
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model || DEFAULT_MODELS.openai
  }

  async chat(request: IAiProviderRequest): Promise<IAiProviderResponse> {
    // Build OpenAI messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: request.systemPrompt },
    ]

    for (const msg of request.messages) {
      if (msg.role === "tool") {
        messages.push({
          role: "tool",
          tool_call_id: msg.toolCallId!,
          content: msg.content,
        })
      } else if (msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.input),
            },
          })),
        })
      } else {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    }

    const tools: OpenAI.ChatCompletionTool[] = request.tools.map(t => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }))

    const createParams: OpenAI.ChatCompletionCreateParamsStreaming = {
      model: request.model || this.model,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      stream: true,
    }
    if (tools.length > 0) {
      createParams.tools = tools
    }

    const stream = await this.client.chat.completions.create(createParams)

    let fullContent = ""
    const toolCallBuffers = new Map<number, { id: string; name: string; args: string }>()
    let finishReason = ""

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (!delta) continue

      if (delta.content) {
        fullContent += delta.content
        request.onChunk?.(delta.content)
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallBuffers.has(tc.index)) {
            toolCallBuffers.set(tc.index, {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              args: "",
            })
          }
          const buf = toolCallBuffers.get(tc.index)!
          if (tc.id) buf.id = tc.id
          if (tc.function?.name) buf.name = tc.function.name
          if (tc.function?.arguments) buf.args += tc.function.arguments
        }
      }

      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason
      }
    }

    const toolCalls = Array.from(toolCallBuffers.values()).map(buf => {
      let input: Record<string, any> = {}
      try { input = JSON.parse(buf.args || "{}") } catch { /* empty */ }
      return { id: buf.id, name: buf.name, input }
    })

    // Usage: OpenAI streaming doesn't always return usage; estimate if missing
    const stopReason = finishReason === "tool_calls" ? "tool_use"
      : finishReason === "length" ? "max_tokens"
      : "end_turn"

    return {
      content: fullContent,
      toolCalls,
      usage: {
        inputTokens: 0,  // OpenAI streaming doesn't provide usage in chunks
        outputTokens: 0,
        model: request.model || this.model,
      },
      stopReason,
    }
  }
}
