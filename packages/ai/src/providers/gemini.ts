import { GoogleGenAI, type Content, type Part, type FunctionCall } from "@google/genai"
import type { IAiProvider, IAiProviderRequest, IAiProviderResponse } from "./types.js"
import { DEFAULT_MODELS } from "./types.js"

export class GeminiProvider implements IAiProvider {
  readonly name = "gemini"
  private client: GoogleGenAI
  private model: string

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenAI({ apiKey })
    this.model = model || DEFAULT_MODELS.gemini
  }

  async chat(request: IAiProviderRequest): Promise<IAiProviderResponse> {
    // Build Gemini contents
    const contents: Content[] = []

    for (const msg of request.messages) {
      if (msg.role === "tool") {
        // Function response
        contents.push({
          role: "function",
          parts: [{
            functionResponse: {
              name: msg.toolCallId ?? "unknown",
              response: { result: msg.content },
            },
          }],
        })
      } else if (msg.role === "assistant") {
        const parts: Part[] = []
        if (msg.content) parts.push({ text: msg.content })
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: { name: tc.name, args: tc.input } as FunctionCall,
            })
          }
        }
        contents.push({ role: "model", parts })
      } else {
        contents.push({
          role: "user",
          parts: [{ text: msg.content }],
        })
      }
    }

    const tools = request.tools.length > 0 ? [{
      functionDeclarations: request.tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      })),
    }] : undefined

    const response = await this.client.models.generateContentStream({
      model: this.model,
      contents,
      config: {
        systemInstruction: request.systemPrompt,
        maxOutputTokens: request.maxTokens ?? 4096,
        tools,
      },
    })

    let fullContent = ""
    const toolCalls: Array<{ id: string; name: string; input: Record<string, any> }> = []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for await (const chunk of response) {
      const text = chunk.text
      if (text) {
        fullContent += text
        request.onChunk?.(text)
      }

      // Check for function calls in parts
      const parts = chunk.candidates?.[0]?.content?.parts
      if (parts) {
        for (const part of parts) {
          if (part.functionCall) {
            toolCalls.push({
              id: `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: part.functionCall.name!,
              input: (part.functionCall.args ?? {}) as Record<string, any>,
            })
          }
        }
      }

      // Usage metadata
      if (chunk.usageMetadata) {
        totalInputTokens = chunk.usageMetadata.promptTokenCount ?? 0
        totalOutputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0
      }
    }

    const hasToolCalls = toolCalls.length > 0
    return {
      content: fullContent,
      toolCalls,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        model: this.model,
      },
      stopReason: hasToolCalls ? "tool_use" : "end_turn",
    }
  }
}
