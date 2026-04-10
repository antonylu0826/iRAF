import Anthropic from "@anthropic-ai/sdk"
import type { IAiProvider, IAiProviderRequest, IAiProviderResponse } from "./types.js"
import { DEFAULT_MODELS } from "./types.js"

export class ClaudeProvider implements IAiProvider {
  readonly name = "anthropic"
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model || DEFAULT_MODELS.anthropic
  }

  async chat(request: IAiProviderRequest): Promise<IAiProviderResponse> {
    // Build Anthropic messages format
    const messages: Anthropic.MessageParam[] = []
    for (const msg of request.messages) {
      if (msg.role === "tool") {
        // Tool result: must be sent as user message with tool_result block
        messages.push({
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: msg.toolCallId!,
            content: msg.content,
          }],
        })
      } else if (msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0) {
        // Assistant message with tool calls
        const content: Anthropic.ContentBlockParam[] = []
        if (msg.content) {
          content.push({ type: "text", text: msg.content })
        }
        for (const tc of msg.toolCalls) {
          content.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.input,
          })
        }
        messages.push({ role: "assistant", content })
      } else {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    }

    const tools: Anthropic.Tool[] = request.tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }))

    const createParams: Anthropic.MessageCreateParamsStreaming = {
      model: request.model || this.model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.systemPrompt,
      messages,
      stream: true,
    }
    if (tools.length > 0) {
      createParams.tools = tools
    }

    const stream = this.client.messages.stream(createParams)

    let fullContent = ""
    const toolCalls: Array<{ id: string; name: string; input: Record<string, any> }> = []
    let thinkingContent = ""

    // Track tool_use blocks being built
    const toolUseBuffers = new Map<number, { id: string; name: string; inputJson: string }>()

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const block = event.content_block
        if (block.type === "thinking") {
          // Extended thinking block start
        } else if (block.type === "tool_use") {
          toolUseBuffers.set(event.index, { id: block.id, name: block.name, inputJson: "" })
        }
      } else if (event.type === "content_block_delta") {
        const delta = event.delta
        if (delta.type === "text_delta") {
          fullContent += delta.text
          request.onChunk?.(delta.text)
        } else if (delta.type === "thinking_delta") {
          thinkingContent += delta.thinking
        } else if (delta.type === "input_json_delta") {
          const buf = toolUseBuffers.get(event.index)
          if (buf) buf.inputJson += delta.partial_json
        }
      } else if (event.type === "content_block_stop") {
        const buf = toolUseBuffers.get(event.index)
        if (buf) {
          let input: Record<string, any> = {}
          try {
            input = JSON.parse(buf.inputJson || "{}")
          } catch { /* empty input */ }
          toolCalls.push({ id: buf.id, name: buf.name, input })
          toolUseBuffers.delete(event.index)
        }
      }
    }

    const finalMessage = await stream.finalMessage()
    const stopReason = finalMessage.stop_reason === "tool_use" ? "tool_use"
      : finalMessage.stop_reason === "max_tokens" ? "max_tokens"
      : "end_turn"

    return {
      content: fullContent,
      toolCalls,
      thinking: thinkingContent || undefined,
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        model: finalMessage.model,
      },
      stopReason,
    }
  }
}
